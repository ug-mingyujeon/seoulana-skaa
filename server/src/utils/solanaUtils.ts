import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import * as ed25519 from 'noble-ed25519';
import bs58 from 'bs58';
import config from '../config';

// Initialize Solana connection
export const connection = new Connection(config.solanaRpcUrl, 'confirmed');

// Import your program IDL (Interface Definition Language)
import idl from '../idl/idl.json';

// Program ID from config - with validation
let programId: PublicKey;
try {
  // Only try to create PublicKey if config.programId is a non-empty string
  if (!config.programId || config.programId.trim() === '') {
    console.warn('No program ID provided in configuration. Using a dummy value for development.');
    // Use the system program as a fallback (this won't actually work for your program calls)
    programId = new PublicKey('11111111111111111111111111111111');
  } else {
    programId = new PublicKey(config.programId);
  }
} catch (error) {
  console.error('Invalid program ID in configuration:', error);
  // Use the system program as a fallback
  programId = new PublicKey('11111111111111111111111111111111');
}

// Create a dummy provider - for actual transactions a real provider with a wallet will be needed
export const getProvider = (wallet: any) => {
  return new AnchorProvider(
    connection,
    wallet,
    { commitment: 'confirmed' }
  );
};

// Get program instance
export const getProgram = (provider: AnchorProvider) => {
  return new Program(idl as any, programId, provider);
};

// Verify a signature using noble-ed25519
export const verifySignature = async (
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> => {
  try {
    return await ed25519.verify(signature, message, publicKey);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

// Find PDA for session account
export const findSessionAccountPDA = async (
  userMainPublicKey: PublicKey,
  sessionPublicKey: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('session'),
      userMainPublicKey.toBuffer(),
      sessionPublicKey.toBuffer()
    ],
    programId
  );
};

// Build transaction for registering session key
export const buildRegisterSessionTransaction = async (
  userMainPublicKey: PublicKey,
  sessionPublicKey: PublicKey,
  expiresAt: number,
  program: Program
): Promise<Transaction> => {
  const [sessionAccountPDA] = await findSessionAccountPDA(
    userMainPublicKey,
    sessionPublicKey
  );

  // Prepare the instruction using Anchor program
  const instruction = await program.methods
    .registerSessionKey(
      sessionPublicKey,
      new BN(expiresAt)
    )
    .accounts({
      userMain: userMainPublicKey,
      sessionAccount: sessionAccountPDA,
      systemProgram: web3.SystemProgram.programId
    })
    .instruction();

  // Create a new transaction and add the instruction
  const transaction = new Transaction().add(instruction);
  transaction.feePayer = userMainPublicKey;
  
  // Get the recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  return transaction;
};

// Build transaction for revoking session key
export const buildRevokeSessionTransaction = async (
  userMainPublicKey: PublicKey,
  sessionPublicKey: PublicKey,
  program: Program
): Promise<Transaction> => {
  const [sessionAccountPDA] = await findSessionAccountPDA(
    userMainPublicKey,
    sessionPublicKey
  );

  // Prepare the instruction using Anchor program
  const instruction = await program.methods
    .revokeSessionKey()
    .accounts({
      userMain: userMainPublicKey,
      sessionAccount: sessionAccountPDA
    })
    .instruction();

  // Create a new transaction and add the instruction
  const transaction = new Transaction().add(instruction);
  transaction.feePayer = userMainPublicKey;
  
  // Get the recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  return transaction;
};

// Decode base58 strings
export const decodeBase58 = (value: string): Uint8Array => {
  return bs58.decode(value);
};

// Encode to base58 string
export const encodeBase58 = (value: Uint8Array): string => {
  return bs58.encode(value);
}; 