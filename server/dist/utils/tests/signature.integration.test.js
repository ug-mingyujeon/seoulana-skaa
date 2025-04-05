"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ed25519 = __importStar(require("noble-ed25519"));
const solanaUtils_1 = require("../solanaUtils");
const crypto_1 = __importDefault(require("crypto"));
// Add debug utility
function toHex(data) {
    return Array.from(data)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
describe('Signature verification integration test', () => {
    it('should correctly verify a valid signature with real keypair', async () => {
        // Generate a private key (32 bytes)
        const privateKey = crypto_1.default.randomBytes(32);
        const privateKeyHex = Buffer.from(privateKey).toString('hex');
        // Derive the public key from the private key
        const publicKey = await ed25519.getPublicKey(privateKeyHex);
        const publicKeyUint8Array = Uint8Array.from(Buffer.from(publicKey, 'hex'));
        console.log('PublicKeyUint8Array (hex):', toHex(publicKeyUint8Array));
        // Log the length to verify it's the right size
        console.log('Public key length:', publicKey.length);
        console.log('PublicKeyUint8Array length:', publicKeyUint8Array.length);
        // Create a message
        const message = Buffer.from('This is a test message');
        console.log('Message (hex):', toHex(message));
        // Sign the message with the private key
        const signature = await ed25519.sign(message, privateKeyHex);
        console.log('Signature (hex):', toHex(signature));
        // Verify the signature with our utility function
        const isValid = await (0, solanaUtils_1.verifySignature)(message, signature, publicKeyUint8Array);
        // Assertion
        expect(isValid).toBe(true);
    });
    it('should reject an invalid signature', async () => {
        // Generate a private key (32 bytes)
        const privateKey = crypto_1.default.randomBytes(32);
        const privateKeyHex = Buffer.from(privateKey).toString('hex');
        // Derive the public key from the private key
        const publicKey = await ed25519.getPublicKey(privateKeyHex);
        const publicKeyUint8Array = Uint8Array.from(Buffer.from(publicKey, 'hex'));
        // Create a message
        const message = Buffer.from('This is a test message');
        // Sign the message with the private key
        const signature = await ed25519.sign(message, privateKeyHex);
        // Modify the message after signing
        const alteredMessage = Buffer.from('This is a modified message');
        // Try to verify with the altered message
        const isValid = await (0, solanaUtils_1.verifySignature)(alteredMessage, signature, publicKeyUint8Array);
        // Assertion - should fail because message was changed
        expect(isValid).toBe(false);
    });
});
