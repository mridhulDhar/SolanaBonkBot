import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import { CryptoService } from "./crypto.service";
//import { Wallet } from '@prisma/client';
import { prisma } from "../config/prisma";

export class WalletService{
    private connection: Connection;

    constructor(){
        const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        this.connection = new Connection(rpcUrl, 'confirmed');
    }

    async createWallet(userId: string): Promise<{publicKey: string; walletId: string}>{
        try{
            const existingWallet = await prisma.wallet.findUnique({
                where: {userId}
            });

            if(existingWallet){
                throw new Error("wallet already exists");
            }
            
            const keypair = Keypair.generate();
            const encrypted = CryptoService.encrypt(Buffer.from(keypair.secretKey));

            const wallet = await prisma.wallet.create({
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
        catch(error){
            throw new Error("failed to create wallet");
        }
    }

    async getWallet(userId: string) : Promise<any> {
        return await prisma.wallet.findUnique({
            where : {userId}
        });
    }

    async getBalance(publicKey: string): Promise<any> {
        try{
            const pubKey = new PublicKey(publicKey);
            const balance = await this.connection.getBalance(pubKey);
            return balance/LAMPORTS_PER_SOL ;
        }
        catch(error){
            return 0;
        }
    }

    async getKeypair(userId: string): Promise<any>{
        const wallet = await this.getWallet(userId);
        if(!wallet){
            throw new Error("wallet not found");
        }

        const secretKey = CryptoService.decrypt(wallet.encryptedPrivateKey, wallet.encryptionIv, wallet.encryptionTag);

        const keypair = Keypair.fromSecretKey(secretKey);

        return keypair;
    }

    async transfer(userId: string, toAddress: string, amount: number) : Promise<any>{
        try{
            const keypair = await this.getKeypair(userId);
            const toPubkey = new PublicKey(toAddress);

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: keypair.publicKey,
                    toPubkey,
                    lamports: amount * LAMPORTS_PER_SOL
                })
            );

            const signature = await sendAndConfirmTransaction(this.connection, transaction, [keypair]);

            return signature
        }
        catch(error){
            throw error;
        }
    }
}