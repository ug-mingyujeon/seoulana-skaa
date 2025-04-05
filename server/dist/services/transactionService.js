"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitTransaction = exports.buildRelayTransaction = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@project-serum/anchor");
const solanaUtils_1 = require("../utils/solanaUtils");
// Build a relay transaction
const buildRelayTransaction = async (sessionPublicKey, targetProgramId, functionId, params, program) => {
    try {
        // Get main wallet from session (this would require a database lookup)
        const userMainPublicKey = await getUserMainFromSession(sessionPublicKey);
        // Find the session account PDA
        const [sessionAccountPDA] = await (0, solanaUtils_1.findSessionAccountPDA)(userMainPublicKey, sessionPublicKey);
        // Create the instruction
        const instruction = await program.methods
            .relayTransaction(targetProgramId, new anchor_1.BN(functionId), params)
            .accounts({
            sessionAccount: sessionAccountPDA,
            userMain: userMainPublicKey,
            targetProgram: targetProgramId
            // Add other required accounts based on your program
        })
            .instruction();
        // Create transaction and add the instruction
        const transaction = new web3_js_1.Transaction().add(instruction);
        transaction.feePayer = sessionPublicKey; // Session key is the fee payer
        // Get the recent blockhash
        const { blockhash } = await solanaUtils_1.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        return transaction;
    }
    catch (error) {
        console.error('Error building relay transaction:', error);
        throw new Error('Failed to build relay transaction');
    }
};
exports.buildRelayTransaction = buildRelayTransaction;
// Submit a transaction to the Solana network
const submitTransaction = async (signedTransaction, options) => {
    try {
        const signature = await solanaUtils_1.connection.sendRawTransaction(signedTransaction.serialize(), options);
        return signature;
    }
    catch (error) {
        console.error('Error submitting transaction:', error);
        throw new Error('Failed to submit transaction');
    }
};
exports.submitTransaction = submitTransaction;
// Helper function to get main wallet public key from session public key
// In a real app, this would query your database
const getUserMainFromSession = async (sessionPublicKey) => {
    // This is a placeholder - you would implement this to query your database
    // For example: 
    // const session = await SessionModel.findOne({ sessionPublicKey: sessionPublicKey.toString() });
    // return new PublicKey(session.userMainPublicKey);
    throw new Error('Not implemented: getUserMainFromSession');
};
