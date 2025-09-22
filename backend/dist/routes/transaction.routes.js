"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const auth_1 = require("../middleware/auth");
const wallet_service_1 = require("../services/wallet.service");
const prisma_1 = require("../config/prisma");
const router = (0, express_1.Router)();
exports.transactionRouter = router;
const walletService = new wallet_service_1.WalletService();
const sendTransactionSchema = zod_1.z.object({
    toAddress: zod_1.z.string().min(32, 'Invalid solana address')
        .max(44, "Invalid solana address"),
    amount: zod_1.z.number()
        .positive('Amount must be positive')
        .max(1000000, 'too large amount'),
});
router.post('/send', auth_1.authenticateToken, async (req, res) => {
    try {
        const { toAddress, amount } = sendTransactionSchema.parse(req.body);
        const userId = req.userId;
        const wallet = await prisma_1.prisma.wallet.findUnique({
            where: { userId },
            select: {
                publicKey: true,
                userId: true,
            }
        });
        if (!wallet) {
            return res.status(404).json({
                error: 'wallet not found'
            });
        }
        const balance = await walletService.getBalance(wallet.publicKey);
        const requiredBalance = amount + 0.000005;
        if (balance < requiredBalance) {
            return res.status(400).json({
                error: 'Insufficient funds',
                details: {
                    required: requiredBalance,
                    available: balance,
                }
            });
        }
        const transaction = await prisma_1.prisma.transaction.create({
            data: {
                userId,
                type: client_1.TransactionType.TRANSFER,
                fromAddress: wallet.publicKey,
                toAddress,
                amount: new library_1.Decimal(amount),
                token: 'SOL',
                status: client_1.TransactionStatus.PENDING
            }
        });
        try {
            const signature = await walletService.transfer(userId, toAddress, amount);
            await prisma_1.prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    signature,
                    status: client_1.TransactionStatus.CONFIRMED,
                    confirmedAt: new Date(),
                    fee: new library_1.Decimal(0.000005),
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
        catch (error) {
            await prisma_1.prisma.transaction.update({
                where: {
                    id: transaction.id
                },
                data: {
                    status: client_1.TransactionStatus.FAILED,
                    error: error.message
                }
            });
            throw error;
        }
    }
    catch (error) {
        return res.json({
            message: 'could not complete the transfer'
        });
    }
});
