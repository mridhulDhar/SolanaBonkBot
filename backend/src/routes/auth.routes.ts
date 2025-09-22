import { Router, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Keypair } from '@solana/web3.js';
import { prisma } from "../config/prisma";
import { WalletService } from "../services/wallet.service";
import {z} from 'zod';
import { CryptoService } from "../services/crypto.service";

const router = Router();
const walletService = new WalletService();

const registerSchema = z.object({
    email: z.email(),
    password: z.string().min(6)
});

const loginSchema = z.object({
    email: z.email(),
    password: z.string()
});

router.post('/register', async (req: Request, res: Response) => {
    try{
        const {email, password} = registerSchema.parse(req.body);
        const existingUser = await prisma.user.findUnique({
            where: {email}
        });

        if(existingUser){
            return res.status(409).json({ error: 'user already exists'});
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const keypair = Keypair.generate();
        const publicKeyString = keypair.publicKey.toString();

        const encrypted = CryptoService.encrypt(Buffer.from(keypair.secretKey));

        const result = await prisma.$transaction(async (tx: any) => {
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash
                }
            });

            const wallet = await tx.wallet.create({
                data: {
                    userId: user.id,
                    publicKey: publicKeyString,
                    encryptedPrivateKey: encrypted.encryptedData,
                    encryptionIv: encrypted.iv,
                    encryptionTag: encrypted.tag
                }
            });

            return {user, wallet};
        });

        const token = jwt.sign(
        {
            userId: result.user.id,
            email: result.user.email
        }, process.env.JWT_SECRET!);

        return res.status(201).json({
            message: "user created",
            token,
            user: {
                id: result.user.id,
                email: result.user.email,
                wallet: result.wallet.publicKey,
            }
        });

    }
    catch(error: any){
        return res.status(500).json({
            message: "failed to register"
        });
    }
});

router.post('/login', async(req: Request, res: Response) => {
    try{
        const {email, password} = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: {email},
            include: {wallet: true}
        });

        if(!user){
            return res.status(401).json({
                message: 'invalid credentials'
            });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if(!isValid){
            return res.status(401).json({
                message: 'invalid credentials'
            });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        const token = jwt.sign({
            userId: user.id,
            email: user.email
        }, process.env.JWT_SECRET!);

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
    catch(error){
        throw new Error("failed to login");
    }
});

export {router as authRouter};