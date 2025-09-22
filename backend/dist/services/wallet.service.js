"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const web3_js_1 = require("@solana/web3.js");
const crypto_service_1 = require("./crypto.service");
//import { Wallet } from '@prisma/client';
const prisma_1 = require("../config/prisma");
class WalletService {
    constructor() {
        const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        this.connection = new web3_js_1.Connection(rpcUrl, 'confirmed');
    }
    async createWallet(userId) {
        try {
            const existingWallet = await prisma_1.prisma.wallet.findUnique({
                where: { userId }
            });
            if (existingWallet) {
                throw new Error("wallet already exists");
            }
            const keypair = web3_js_1.Keypair.generate();
            const encrypted = crypto_service_1.CryptoService.encrypt(Buffer.from(keypair.secretKey));
            const wallet = await prisma_1.prisma.wallet.create({
                data: {
                    userId,
                    publicKey: keypair.publicKey.toString(),
                    encryptedPrivateKey: encrypted.encryptedData,
                    encryptionIv: encrypted.iv,
                    encryptionTag: encrypted.tag,
                }
            });
            return {
                publicKey: wallet.publicKey,
                walletId: wallet.id
            };
        }
        catch (error) {
            throw new Error("failed to create wallet");
        }
    }
    async getWallet(userId) {
        return await prisma_1.prisma.wallet.findUnique({
            where: { userId }
        });
    }
    async getBalance(publicKey) {
        try {
            const pubKey = new web3_js_1.PublicKey(publicKey);
            const balance = await this.connection.getBalance(pubKey);
            return balance / web3_js_1.LAMPORTS_PER_SOL;
        }
        catch (error) {
            return 0;
        }
    }
    async getKeypair(userId) {
        const wallet = await this.getWallet(userId);
        if (!wallet) {
            throw new Error("wallet not found");
        }
        const secretKey = crypto_service_1.CryptoService.decrypt(wallet.encryptedPrivateKey, wallet.encryptionIv, wallet.encryptionTag);
        const keypair = web3_js_1.Keypair.fromSecretKey(secretKey);
        return keypair;
    }
    async transfer(userId, toAddress, amount) {
        try {
            const keypair = await this.getKeypair(userId);
            const toPubkey = new web3_js_1.PublicKey(toAddress);
            const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
                fromPubkey: keypair.publicKey,
                toPubkey,
                lamports: amount * web3_js_1.LAMPORTS_PER_SOL
            }));
            const signature = await (0, web3_js_1.sendAndConfirmTransaction)(this.connection, transaction, [keypair]);
            return signature;
        }
        catch (error) {
            throw error;
        }
    }
}
exports.WalletService = WalletService;
