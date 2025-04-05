"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSessionWatcher = exports.revokeSession = exports.revokeSessionInDb = exports.isSessionValid = exports.storeSession = exports.verifySessionKeySignature = void 0;
const sessionModel_1 = __importDefault(require("../models/sessionModel"));
const solanaUtils_1 = require("../utils/solanaUtils");
const config_1 = __importDefault(require("../config"));
// Verify a session key signature
const verifySessionKeySignature = async (sessionKeyPublicKey, nonce, signature) => {
    try {
        // Decode the public keys and signature
        const sessionPubKeyBytes = (0, solanaUtils_1.decodeBase58)(sessionKeyPublicKey);
        const signatureBytes = (0, solanaUtils_1.decodeBase58)(signature);
        // Create the message that should have been signed
        // "This sessionKey.publicKey is my session key" + sessionKeyPublicKey + nonce
        const messagePrefix = "This sessionKey.publicKey is my session key";
        const nonceBytes = Buffer.from(nonce);
        const message = Buffer.concat([
            Buffer.from(messagePrefix),
            nonceBytes
        ]);
        // Verify the signature
        return await (0, solanaUtils_1.verifySignature)(message, signatureBytes, sessionPubKeyBytes);
    }
    catch (error) {
        console.error('Session key verification error:', error);
        return false;
    }
};
exports.verifySessionKeySignature = verifySessionKeySignature;
// Store session in database
const storeSession = async (sessionPublicKey, userMainPublicKey, expiresAt) => {
    try {
        await sessionModel_1.default.create({
            sessionPublicKey,
            userMainPublicKey,
            expiresAt,
            isRevoked: false
        });
    }
    catch (error) {
        console.error('Error storing session:', error);
        throw new Error('Failed to store session');
    }
};
exports.storeSession = storeSession;
// Check if session is valid and not expired
const isSessionValid = async (sessionPublicKey) => {
    try {
        const session = await sessionModel_1.default.findOne({ sessionPublicKey });
        if (!session) {
            return false;
        }
        const currentTime = Math.floor(Date.now() / 1000); // Convert to UNIX timestamp
        return !session.isRevoked && session.expiresAt > currentTime;
    }
    catch (error) {
        console.error('Error checking session validity in DuckDB:', error);
        return false;
    }
};
exports.isSessionValid = isSessionValid;
// Mark a session as revoked - renamed to avoid conflict
const revokeSessionInDb = async (sessionPublicKey, userMainPublicKey) => {
    try {
        const result = await sessionModel_1.default.updateOne({ sessionPublicKey, userMainPublicKey }, { isRevoked: true });
        return result.modifiedCount > 0;
    }
    catch (error) {
        console.error('Error revoking session:', error);
        return false;
    }
};
exports.revokeSessionInDb = revokeSessionInDb;
// Original function can remain as an alias if needed
exports.revokeSession = exports.revokeSessionInDb;
// Start background watcher to auto-revoke expired sessions
const startSessionWatcher = () => {
    const checkInterval = config_1.default.autoRevokeIntervalMinutes * 60 * 1000; // Convert minutes to milliseconds
    setInterval(async () => {
        try {
            console.log('Checking for expired sessions...');
            const currentTime = Math.floor(Date.now() / 1000); // Convert to UNIX timestamp
            // Find expired sessions that aren't already revoked
            const expiredSessions = await sessionModel_1.default.find({
                expiresAt: { $lt: currentTime },
                isRevoked: false
            });
            console.log(`Found ${expiredSessions.length} expired sessions to revoke`);
            // Process each expired session
            for (const session of expiredSessions) {
                try {
                    // Mark as revoked in the database
                    await sessionModel_1.default.updateOne({ sessionPublicKey: session.sessionPublicKey }, { isRevoked: true });
                    // Here you would also submit an on-chain transaction to close the session
                    // For example:
                    // await closeSessionOnChain(session.sessionPublicKey, session.userMainPublicKey);
                    console.log(`Successfully revoked session: ${session.sessionPublicKey}`);
                }
                catch (innerError) {
                    console.error(`Failed to revoke session ${session.sessionPublicKey}:`, innerError);
                }
            }
        }
        catch (error) {
            console.error('Error in session watcher:', error);
        }
    }, checkInterval);
    console.log(`Session watcher started. Checking every ${config_1.default.autoRevokeIntervalMinutes} minutes.`);
};
exports.startSessionWatcher = startSessionWatcher;
// Close an expired session on-chain (placeholder)
const closeSessionOnChain = async (sessionPublicKey, userMainPublicKey) => {
    try {
        // This would be implemented with your specific on-chain logic
        // For now, we'll just log that it would happen
        console.log(`Would close session on-chain: ${sessionPublicKey} for user ${userMainPublicKey}`);
        return true;
    }
    catch (error) {
        console.error('Error closing session on-chain:', error);
        return false;
    }
};
