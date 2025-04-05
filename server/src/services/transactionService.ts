import { Transaction, PublicKey, SendOptions } from '@solana/web3.js';
import { Program, BN } from '@project-serum/anchor';
import { connection, findSessionAccountPDA } from '../utils/solanaUtils';

// Build a relay transaction
export const buildRelayTransaction = async (
  sessionPublicKey: PublicKey,
  targetProgramId: PublicKey,
  functionId: number,
  params: any[],
  program: Program
): Promise<Transaction> => {
  try {
    // Get main wallet from session (this would require a database lookup)
    const userMainPublicKey = await getUserMainFromSession(sessionPublicKey);
    
    // Find the session account PDA
    const [sessionAccountPDA] = await findSessionAccountPDA(
      userMainPublicKey,
      sessionPublicKey
    );
    
    // Create the instruction
    const instruction = await program.methods
      .relayTransaction(
        targetProgramId,
        new BN(functionId),
        params
      )
      .accounts({
        sessionAccount: sessionAccountPDA,
        userMain: userMainPublicKey,
        targetProgram: targetProgramId
        // Add other required accounts based on your program
      })
      .instruction();
    
    // Create transaction and add the instruction
    const transaction = new Transaction().add(instruction);
    transaction.feePayer = sessionPublicKey; // Session key is the fee payer
    
    // Get the recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    
    return transaction;
  } catch (error) {
    console.error('Error building relay transaction:', error);
    throw new Error('Failed to build relay transaction');
  }
};

// Submit a transaction to the Solana network
export const submitTransaction = async (
  signedTransaction: Transaction,
  options?: SendOptions
): Promise<string> => {
  try {
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      options
    );
    
    return signature;
  } catch (error) {
    console.error('Error submitting transaction:', error);
    throw new Error('Failed to submit transaction');
  }
};

// Helper function to get main wallet public key from session public key
// In a real app, this would query your database
const getUserMainFromSession = async (sessionPublicKey: PublicKey): Promise<PublicKey> => {
  // This is a placeholder - you would implement this to query your database
  // For example: 
  // const session = await SessionModel.findOne({ sessionPublicKey: sessionPublicKey.toString() });
  // return new PublicKey(session.userMainPublicKey);
  
  throw new Error('Not implemented: getUserMainFromSession');
}; 