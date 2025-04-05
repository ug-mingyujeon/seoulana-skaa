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
exports.encodeBase58 = exports.decodeBase58 = exports.buildRevokeSessionTransaction = exports.buildRegisterSessionTransaction = exports.findSessionAccountPDA = exports.verifySignature = exports.getProgram = exports.getProvider = exports.connection = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@project-serum/anchor");
const ed25519 = __importStar(require("noble-ed25519"));
const bs58_1 = __importDefault(require("bs58"));
const config_1 = __importDefault(require("../config"));
// Initialize Solana connection
exports.connection = new web3_js_1.Connection(config_1.default.solanaRpcUrl, 'confirmed');
// Import your program IDL (Interface Definition Language)
const idl_json_1 = __importDefault(require("../idl/idl.json"));
// Program ID from config - with validation
let programId;
try {
    // Only try to create PublicKey if config.programId is a non-empty string
    if (!config_1.default.programId || config_1.default.programId.trim() === '') {
        console.warn('No program ID provided in configuration. Using a dummy value for development.');
        // Use the system program as a fallback (this won't actually work for your program calls)
        programId = new web3_js_1.PublicKey('11111111111111111111111111111111');
    }
    else {
        programId = new web3_js_1.PublicKey(config_1.default.programId);
    }
}
catch (error) {
    console.error('Invalid program ID in configuration:', error);
    // Use the system program as a fallback
    programId = new web3_js_1.PublicKey('11111111111111111111111111111111');
}
// Create a dummy provider - for actual transactions a real provider with a wallet will be needed
const getProvider = (wallet) => {
    return new anchor_1.AnchorProvider(exports.connection, wallet, { commitment: 'confirmed' });
};
exports.getProvider = getProvider;
// Get program instance
const getProgram = (provider) => {
    return new anchor_1.Program(idl_json_1.default, programId, provider);
};
exports.getProgram = getProgram;
// Verify a signature using noble-ed25519
const verifySignature = async (message, signature, publicKey) => {
    try {
        return await ed25519.verify(signature, message, publicKey);
    }
    catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
};
exports.verifySignature = verifySignature;
// Find PDA for session account
const findSessionAccountPDA = async (userMainPublicKey, sessionPublicKey) => {
    return web3_js_1.PublicKey.findProgramAddressSync([
        Buffer.from('session'),
        userMainPublicKey.toBuffer(),
        sessionPublicKey.toBuffer()
    ], programId);
};
exports.findSessionAccountPDA = findSessionAccountPDA;
// Build transaction for registering session key
const buildRegisterSessionTransaction = async (userMainPublicKey, sessionPublicKey, expiresAt, program) => {
    const [sessionAccountPDA] = await (0, exports.findSessionAccountPDA)(userMainPublicKey, sessionPublicKey);
    // Prepare the instruction using Anchor program
    const instruction = await program.methods
        .registerSessionKey(sessionPublicKey, new anchor_1.BN(expiresAt))
        .accounts({
        userMain: userMainPublicKey,
        sessionAccount: sessionAccountPDA,
        systemProgram: anchor_1.web3.SystemProgram.programId
    })
        .instruction();
    // Create a new transaction and add the instruction
    const transaction = new web3_js_1.Transaction().add(instruction);
    transaction.feePayer = userMainPublicKey;
    // Get the recent blockhash
    const { blockhash } = await exports.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    return transaction;
};
exports.buildRegisterSessionTransaction = buildRegisterSessionTransaction;
// Build transaction for revoking session key
const buildRevokeSessionTransaction = async (userMainPublicKey, sessionPublicKey, program) => {
    const [sessionAccountPDA] = await (0, exports.findSessionAccountPDA)(userMainPublicKey, sessionPublicKey);
    // Prepare the instruction using Anchor program
    const instruction = await program.methods
        .revokeSessionKey()
        .accounts({
        userMain: userMainPublicKey,
        sessionAccount: sessionAccountPDA
    })
        .instruction();
    // Create a new transaction and add the instruction
    const transaction = new web3_js_1.Transaction().add(instruction);
    transaction.feePayer = userMainPublicKey;
    // Get the recent blockhash
    const { blockhash } = await exports.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    return transaction;
};
exports.buildRevokeSessionTransaction = buildRevokeSessionTransaction;
// Decode base58 strings
const decodeBase58 = (value) => {
    return bs58_1.default.decode(value);
};
exports.decodeBase58 = decodeBase58;
// Encode to base58 string
const encodeBase58 = (value) => {
    return bs58_1.default.encode(value);
};
exports.encodeBase58 = encodeBase58;
