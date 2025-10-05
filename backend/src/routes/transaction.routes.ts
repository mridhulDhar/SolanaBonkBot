import { Router, Response, NextFunction } from "express";
import {z} from 'zod';
import { TransactionStatus, TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { WalletService } from "../services/wallet.service";
import {prisma} from '../config/prisma';
import { error } from "winston";

const router = Router();
const walletService = new WalletService();

const sendTransactionSchema = z.object({
    toAddress: z.string().min(32, 'Invalid solana address')
    .max(44, "Invalid solana address"),

    amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'too large amount'),
});

router.post('/send', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const {toAddress, amount} = sendTransactionSchema.parse(req.body);
        const userId = req.userId!;

        const wallet = await prisma.wallet.findUnique({
            where : {userId},
            select : {
                publicKey: true,
                userId: true,
            }
        });

        if(!wallet){
            return res.status(404).json({
                error: 'wallet not found'
            });
        }

        const balance = await walletService.getBalance(wallet.publicKey);
        const requiredBalance = amount + 0.000005;

        if(balance< requiredBalance){
            return res.status(400).json({
                error: 'Insufficient funds',
                details: {
                    required: requiredBalance,
                    available: balance,
                }
            });
        }

        const transaction = await prisma.transaction.create({
            data: {
                userId,
                type: TransactionType.TRANSFER,
                fromAddress: wallet.publicKey,
                toAddress,
                amount: new Decimal(amount),
                token: 'SOL',
                status: TransactionStatus.PENDING
            }
        });

        try {
            const signature = await walletService.transfer(userId, toAddress, amount);

            await prisma.transaction.update({
                where: {id: transaction.id},
                data: {
                    signature,
                    status: TransactionStatus.CONFIRMED,
                    confirmedAt: new Date(),
                    fee: new Decimal(0.000005),
                }
            });

            return res.json({
                success: true,
                transactionId: transaction.id,
                signature,
                status: 'confirmed',
                amount,
                toAddress
            });
        }
        catch(error: any){
            await prisma.transaction.update({
                where: {
                    id: transaction.id
                },
                data: {
                    status: TransactionStatus.FAILED,
                    error: error.message
                }
            });
            throw error;
        }
        
    }
    catch(error){
        return res.json({
            message: 'could not complete the transfer'
        })
    }
});


router.get("/status/:transactionId", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const {transactionId} = req.params;
        const userId = req.userId;

        console.log("transaction and user id---"+ transactionId+"--------"+userId )

        const transaction = await prisma.transaction.findFirst({
            where : {
                id: transactionId,
                userId
            }
        });

        if(!transaction){
            return res.status(404).json({
                error: "transaction not found"
            });
        }

        let onChainStatus = null;
        if(transaction.signature){
            const details = await walletService.getTransactionDetails(transaction.signature);
            if(details){
                onChainStatus = {
                    slot: details.slot,
                    confirmation: details.confirmationStatus,
                    blockTime: details.blockTime
                };
            }
        }

        return res.json({
            id: transaction.id,
            status: transaction.status,
            signature: transaction.signature,
            type: transaction.type,
            amount: transaction.amount.toString(),
            token: transaction.token,
            fromAddress: transaction.fromAddress,
            toAddress: transaction.toAddress,
            fee: transaction.fee?.toString() || null,
            error: transaction.error,
            createdAt: transaction.createdAt,
            confirmedAt: transaction.confirmedAt,
            onChainStatus
        })
    }
    catch(error){
        return res.json({
            message: "Something went wrong on the network"
        })
    }
});

export {router as transactionRouter};