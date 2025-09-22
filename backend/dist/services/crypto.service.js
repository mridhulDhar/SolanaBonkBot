"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class CryptoService {
    static encrypt(data) {
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(this.algorithm, this.masterKey, iv);
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
    static decrypt(encryptedData, iv, tag) {
        const decipher = crypto_1.default.createDecipheriv(this.algorithm, this.masterKey, Buffer.from(iv, 'base64'));
        decipher.setAuthTag(Buffer.from(tag, 'base64'));
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedData, 'base64')),
            decipher.final()
        ]);
        return decrypted;
    }
    static hashPassword(password) {
        return crypto_1.default.pbkdf2Sync(password, 'salt', 100000, 64, 'sha512').toString('hex');
    }
    static verifyPassword(password, hash) {
        const hashToVerify = crypto_1.default.pbkdf2Sync(password, 'salt', 100000, 64, 'sha512').toString('hex');
        return hash === hashToVerify;
    }
}
exports.CryptoService = CryptoService;
_a = CryptoService;
CryptoService.algorithm = 'aes-256-gcm';
(() => {
    const key = 'f63ad8edee5afe45ffa1b2681710d9a5e03ad960a217332d4f72eff48d2e1095';
    if (!key || key.length !== 64) {
        throw new Error('Invalid MASTER_ENCRYPTION_KEY. Must be 32 bytes (64 hex characters)');
    }
    _a.masterKey = Buffer.from(key, "hex");
})();
