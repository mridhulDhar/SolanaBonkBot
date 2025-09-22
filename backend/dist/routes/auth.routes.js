"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../config/prisma");
const wallet_service_1 = require("../services/wallet.service");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
exports.authRouter = router;
const walletService = new wallet_service_1.WalletService();
const registerSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(6)
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string()
});
router.post('/register', async (req, res) => {
    try {
        const { email, password } = registerSchema.parse(req.body);
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(409).json({ error: 'user already exists' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash
                }
            });
            const wallet = await walletService.createWallet(user.id);
            return { user, wallet };
        });
        const token = jsonwebtoken_1.default.sign({
            userId: result.user.id,
            email: result.user.email
        }, process.env.JWT_SECRET);
        res.status(201).json({
            message: "user created",
            token,
            user: {
                id: result.user.id,
                email: result.user.email,
                wallet: result.wallet.publicKey,
            }
        });
    }
    catch (error) {
        throw new Error("failed to register");
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
            include: { wallet: true }
        });
        if (!user) {
            return res.status(401).json({
                message: 'invalid credentials'
            });
        }
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({
                message: 'invalid credentials'
            });
        }
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email
        }, process.env.JWT_SECRET);
        res.status(200).json({
            message: 'logged in',
            token,
            user: {
                id: user.id,
                email: user.email,
                wallet: user.wallet?.publicKey
            }
        });
    }
    catch (error) {
        throw new Error("failed to login");
    }
});
