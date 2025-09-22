import crypto from 'crypto';

export class CryptoService {
    private static algorithm : crypto.CipherGCMTypes = 'aes-256-gcm';
    private static masterKey: Buffer;

    static{
        const key = '';
        if(!key || key.length !== 64){
            throw new Error('Invalid MASTER_ENCRYPTION_KEY. Must be 32 bytes (64 hex characters)');
        }

        this.masterKey = Buffer.from(key, "hex");
    }

    static encrypt(data: Buffer): {
        encryptedData: string;
        iv: string;
        tag: string
    } {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

        // Encrypts your whole plaintext buffer (data) into ciphertext.
        //Ensures no leftover bytes are missing. Done by final
        //Produces one continuous buffer you can base64-encode
        //Data may arrive in chunks (like a file stream, network packets).
        //update() lets you feed in pieces progressively.
        //final() signals “I’m done, flush out whatever’s left.”

        const encrypted = Buffer.concat([
            cipher.update(data),
            cipher.final()
        ]);

        const tag = cipher.getAuthTag();

        return {
            encryptedData: encrypted.toString('base64'),
            iv: iv.toString('base64'),
            tag: tag.toString('base64')
        };

    }

    static decrypt(encryptedData: string, iv: string, tag: string): Buffer {
        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.masterKey,
            Buffer.from(iv, 'base64')
        );
        
        decipher.setAuthTag(Buffer.from(tag, 'base64'));
        
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedData, 'base64')),
            decipher.final()
            ]);
        
        return decrypted;
  }

    static hashPassword(password: string): string{
        return crypto.pbkdf2Sync(password, 'salt', 100000, 64, 'sha512').toString('hex');
    }

    static verifyPassword(password: string, hash: string): boolean {
        const hashToVerify = crypto.pbkdf2Sync(password, 'salt', 100000, 64, 'sha512').toString('hex');
        return hash === hashToVerify;
    }
}