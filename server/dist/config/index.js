"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.default = {
    port: process.env.PORT || 3000,
    sqlitePath: process.env.SQLITE_PATH || './solana_sessions.db',
    solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    programId: process.env.PROGRAM_ID || 'JCbSFuVLdwzefyEDV4bjMjA16qW7eivCrN8mkZV5iZAY',
    autoRevokeIntervalMinutes: parseInt(process.env.AUTO_REVOKE_INTERVAL_MINUTES || '60', 10)
};
