import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 3000,
  sqlitePath: process.env.SQLITE_PATH || './solana_sessions.db',
  solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  programId: process.env.PROGRAM_ID || 'JCbSFuVLdwzefyEDV4bjMjA16qW7eivCrN8mkZV5iZAY',
  autoRevokeIntervalMinutes: parseInt(process.env.AUTO_REVOKE_INTERVAL_MINUTES || '60', 10)
}; 