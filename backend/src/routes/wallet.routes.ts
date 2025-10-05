import { Router, Response } from "express";
import { WalletService } from "../services/wallet.service";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { prisma } from "../config/prisma";

const router = Router();

const walletService = new WalletService();
const airdropSchema = z.object({
    amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'too large amount'),
});

router.get("/info", authenticateToken, async (req: AuthRequest, res: Response) => {
    try{
        const userId = req.userId!;

        const wallet = await prisma.wallet.findUnique({
            where: {
                userId
            }
        });

        if(!wallet){
            return res.status(404).json({
                "message": "wallet not found"
            });
        }

        const balance = await walletService.getBalance(wallet.publicKey);

        return res.status(200).json({
            publicKey: wallet.publicKey,
            balance
        });

    }
    catch(error){
        return res.status(400).json({
            message: "error"
        })
    }
});


router.post("/airdrop", authenticateToken, async (req: AuthRequest, res: Response) => {
    try{
        const userId = req.userId!;
        const {amount} = airdropSchema.parse(req.body);

        const wallet = await prisma.wallet.findUnique({
            where :{
                userId
            },
            select : {
                publicKey: true
            }
        });

        if(!wallet){
            return res.status(404).json({
                message: "wallet not found"
            });
        }

        const signature = await walletService.requestAirdrop(wallet.publicKey, amount);

        await prisma.transaction.create({
            data:{
                userId,
                signature,
                status: "CONFIRMED",
                type: "TRANSFER",
                toAddress: wallet.publicKey,
                amount,
                token: "SOL",
                details: {
                    type: "airdrop"
                },
                confirmedAt: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: `Airdrop of ${amount} successful`,
            signature,
            publicKey: wallet.publicKey
        });

    }
    catch(error){
        return res.json({
            message: "airdrop failed"
        });
    }
})

export {router as walletRouter};