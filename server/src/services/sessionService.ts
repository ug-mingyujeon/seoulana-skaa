import { PublicKey, Keypair } from '@solana/web3.js';
import SessionModel from '../models/sessionModel';
import { connection, verifySignature, decodeBase58, encodeBase58, getProvider, getProgram, buildRevokeSessionTransaction } from '../utils/solanaUtils';
import config from '../config';

// Verify a session key signature
export const verifySessionKeySignature = async (
  sessionKeyPublicKey: string,
  nonce: string,
  signature: string
): Promise<boolean> => {
  try {
    // Decode the public keys and signature
    const sessionPubKeyBytes = decodeBase58(sessionKeyPublicKey);
    const signatureBytes = decodeBase58(signature);
    
    // Create the message that should have been signed
    // "This sessionKey.publicKey is my session key" + sessionKeyPublicKey + nonce
    const messagePrefix = "This sessionKey.publicKey is my session key";
    const nonceBytes = Buffer.from(nonce);
    
    const message = Buffer.concat([
      Buffer.from(messagePrefix),
      nonceBytes
    ]);
    
    // Verify the signature
    return await verifySignature(message, signatureBytes, sessionPubKeyBytes);
  } catch (error) {
    console.error('Session key verification error:', error);
    return false;
  }
};

// Store session in database
export const storeSession = async (
  sessionPublicKey: string,
  userMainPublicKey: string,
  expiresAt: number
): Promise<void> => {
  try {
    await SessionModel.create({
      sessionPublicKey,
      userMainPublicKey,
      expiresAt,
      isRevoked: false
    });
  } catch (error) {
    console.error('Error storing session:', error);
    throw new Error('Failed to store session');
  }
};

// Check if session is valid and not expired
export const isSessionValid = async (
  sessionPublicKey: string
): Promise<boolean> => {
  try {
    const session = await SessionModel.findOne({ sessionPublicKey });
    
    if (!session) {
      return false;
    }
    
    const currentTime = Math.floor(Date.now() / 1000); // Convert to UNIX timestamp
    
    return !session.isRevoked && session.expiresAt > currentTime;
  } catch (error) {
    console.error('Error checking session validity in DuckDB:', error);
    return false;
  }
};

// Mark a session as revoked - renamed to avoid conflict
export const revokeSessionInDb = async (
  sessionPublicKey: string,
  userMainPublicKey: string
): Promise<boolean> => {
  try {
    const result = await SessionModel.updateOne(
      { sessionPublicKey, userMainPublicKey },
      { isRevoked: true }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error revoking session:', error);
    return false;
  }
};

// Original function can remain as an alias if needed
export const revokeSession = revokeSessionInDb;

// Start background watcher to auto-revoke expired sessions
export const startSessionWatcher = (): void => {
  const checkInterval = config.autoRevokeIntervalMinutes * 60 * 1000; // Convert minutes to milliseconds
  
  setInterval(async () => {
    try {
      console.log('Checking for expired sessions...');
      const currentTime = Math.floor(Date.now() / 1000); // Convert to UNIX timestamp
      
      // Find expired sessions that aren't already revoked
      const expiredSessions = await SessionModel.find({
        expiresAt: { $lt: currentTime },
        isRevoked: false
      });
      
      console.log(`Found ${expiredSessions.length} expired sessions to revoke`);
      
      // Process each expired session
      for (const session of expiredSessions) {
        try {
          // Mark as revoked in the database
          await SessionModel.updateOne(
            { sessionPublicKey: session.sessionPublicKey },
            { isRevoked: true }
          );
          
          // Here you would also submit an on-chain transaction to close the session
          // For example:
          // await closeSessionOnChain(session.sessionPublicKey, session.userMainPublicKey);
          
          console.log(`Successfully revoked session: ${session.sessionPublicKey}`);
        } catch (innerError) {
          console.error(`Failed to revoke session ${session.sessionPublicKey}:`, innerError);
        }
      }
    } catch (error) {
      console.error('Error in session watcher:', error);
    }
  }, checkInterval);
  
  console.log(`Session watcher started. Checking every ${config.autoRevokeIntervalMinutes} minutes.`);
};

// Close an expired session on-chain (placeholder)
const closeSessionOnChain = async (
  sessionPublicKey: string,
  userMainPublicKey: string
): Promise<boolean> => {
  try {
    // This would be implemented with your specific on-chain logic
    // For now, we'll just log that it would happen
    console.log(`Would close session on-chain: ${sessionPublicKey} for user ${userMainPublicKey}`);
    return true;
  } catch (error) {
    console.error('Error closing session on-chain:', error);
    return false;
  }
}; 