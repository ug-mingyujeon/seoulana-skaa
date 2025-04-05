"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relayTransaction = exports.revokeSession = exports.registerSessionKey = exports.verifySessionKey = void 0;
const web3_js_1 = require("@solana/web3.js");
const sessionService_1 = require("../services/sessionService");
const transactionService_1 = require("../services/transactionService");
const solanaUtils_1 = require("../utils/solanaUtils");
/**
 * @swagger
 * /api/session/verify:
 *   post:
 *     summary: 세션 키 서명 검증
 *     tags: [Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionPublicKey
 *               - nonce
 *               - signature
 *             properties:
 *               sessionPublicKey:
 *                 type: string
 *                 description: 세션 공개 키
 *               nonce:
 *                 type: string
 *                 description: 난수값
 *               signature:
 *                 type: string
 *                 description: 메인 지갑으로 서명한 값
 *     responses:
 *       200:
 *         description: 서명이 성공적으로 검증됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 sessionPublicKey:
 *                   type: string
 *       401:
 *         description: 유효하지 않은 서명
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const verifySessionKey = async (req, res) => {
    try {
        const { sessionPublicKey, nonce, signature } = req.body;
        if (!sessionPublicKey || !nonce || !signature) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        // Verify the signature
        const isValid = await (0, sessionService_1.verifySessionKeySignature)(sessionPublicKey, nonce, signature);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid signature' });
        }
        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Session key signature verified successfully',
            sessionPublicKey,
        });
    }
    catch (error) {
        console.error('Error verifying session key:', error);
        return res.status(500).json({ error: 'Server error during verification' });
    }
};
exports.verifySessionKey = verifySessionKey;
/**
 * @swagger
 * /api/session/register:
 *   post:
 *     summary: 세션 키 등록
 *     tags: [Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionPublicKey
 *               - userMainPublicKey
 *               - expiresAt
 *             properties:
 *               sessionPublicKey:
 *                 type: string
 *                 description: 세션 공개 키
 *               userMainPublicKey:
 *                 type: string
 *                 description: 사용자 메인 지갑 공개 키
 *               expiresAt:
 *                 type: number
 *                 description: 만료 시간 (UNIX 타임스탬프)
 *     responses:
 *       200:
 *         description: 세션 등록 트랜잭션 생성 성공
 *       400:
 *         description: 필수 파라미터 누락
 *       500:
 *         description: 서버 에러
 */
const registerSessionKey = async (req, res) => {
    try {
        const { sessionPublicKey, userMainPublicKey, expiresAt } = req.body;
        if (!sessionPublicKey || !userMainPublicKey || !expiresAt) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        // Convert public keys to PublicKey objects
        const sessionPubKey = new web3_js_1.PublicKey(sessionPublicKey);
        const userMainPubKey = new web3_js_1.PublicKey(userMainPublicKey);
        // This is a placeholder - in a real app, you'd need to get a real provider with a wallet
        // For the demo, we're building the transaction but not signing it on the server
        const dummyWallet = { publicKey: userMainPubKey };
        const provider = (0, solanaUtils_1.getProvider)(dummyWallet);
        const program = (0, solanaUtils_1.getProgram)(provider);
        // Build the transaction
        const transaction = await (0, solanaUtils_1.buildRegisterSessionTransaction)(userMainPubKey, sessionPubKey, expiresAt, program);
        // Store session in the database
        await (0, sessionService_1.storeSession)(sessionPublicKey, userMainPublicKey, expiresAt);
        // Serialize the transaction to send to the client
        const serializedTransaction = transaction.serialize({ requireAllSignatures: false }).toString('base64');
        return res.status(200).json({
            success: true,
            message: 'Session registration transaction created',
            transaction: serializedTransaction
        });
    }
    catch (error) {
        console.error('Error registering session key:', error);
        return res.status(500).json({ error: 'Server error during registration' });
    }
};
exports.registerSessionKey = registerSessionKey;
/**
 * @swagger
 * /api/session/revoke:
 *   post:
 *     summary: 세션 키 취소
 *     tags: [Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionPublicKey
 *               - userMainPublicKey
 *             properties:
 *               sessionPublicKey:
 *                 type: string
 *                 description: 취소할 세션 공개 키
 *               userMainPublicKey:
 *                 type: string
 *                 description: 사용자 메인 지갑 공개 키
 *     responses:
 *       200:
 *         description: 세션 취소 트랜잭션 생성 성공
 *       404:
 *         description: 세션을 찾을 수 없거나 이미 취소됨
 */
const revokeSession = async (req, res) => {
    try {
        const { sessionPublicKey, userMainPublicKey } = req.body;
        if (!sessionPublicKey || !userMainPublicKey) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        // Convert public keys to PublicKey objects
        const sessionPubKey = new web3_js_1.PublicKey(sessionPublicKey);
        const userMainPubKey = new web3_js_1.PublicKey(userMainPublicKey);
        // This is a placeholder - in a real app, you'd need to get a real provider with a wallet
        const dummyWallet = { publicKey: userMainPubKey };
        const provider = (0, solanaUtils_1.getProvider)(dummyWallet);
        const program = (0, solanaUtils_1.getProgram)(provider);
        // Build the revocation transaction
        const transaction = await (0, solanaUtils_1.buildRevokeSessionTransaction)(userMainPubKey, sessionPubKey, program);
        // Mark the session as revoked in the database
        const revoked = await (0, sessionService_1.revokeSessionInDb)(sessionPublicKey, userMainPublicKey);
        if (!revoked) {
            return res.status(404).json({ error: 'Session not found or already revoked' });
        }
        // Serialize the transaction to send to the client
        const serializedTransaction = transaction.serialize({ requireAllSignatures: false }).toString('base64');
        return res.status(200).json({
            success: true,
            message: 'Session revocation transaction created',
            transaction: serializedTransaction
        });
    }
    catch (error) {
        console.error('Error revoking session:', error);
        return res.status(500).json({ error: 'Server error during revocation' });
    }
};
exports.revokeSession = revokeSession;
/**
 * @swagger
 * /api/transaction/relay:
 *   post:
 *     summary: 세션 키를 이용한 트랜잭션 중계
 *     tags: [Transaction]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionPublicKey
 *               - targetProgramId
 *               - signedTransaction
 *             properties:
 *               sessionPublicKey:
 *                 type: string
 *                 description: 세션 공개 키
 *               targetProgramId:
 *                 type: string
 *                 description: 대상 프로그램 ID
 *               functionId:
 *                 type: number
 *                 description: 호출할 함수 ID
 *               params:
 *                 type: array
 *                 description: 함수 파라미터
 *               signedTransaction:
 *                 type: string
 *                 description: 세션 키로 서명된 트랜잭션 (Base64)
 *     responses:
 *       200:
 *         description: 트랜잭션 제출 성공
 *       401:
 *         description: 유효하지 않은 세션
 */
const relayTransaction = async (req, res) => {
    try {
        const { sessionPublicKey, targetProgramId, functionId, params, signedTransaction } = req.body;
        if (!sessionPublicKey || !targetProgramId || !signedTransaction) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        // Check if the session is valid
        const isValid = await (0, sessionService_1.isSessionValid)(sessionPublicKey);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }
        // If the client provided a pre-signed transaction, we can directly submit it
        if (signedTransaction) {
            // Deserialize the transaction
            const bufferTransaction = Buffer.from(signedTransaction, 'base64');
            const transaction = web3_js_1.Transaction.from(bufferTransaction);
            // Submit the transaction
            const signature = await (0, transactionService_1.submitTransaction)(transaction, {
                skipPreflight: false,
                preflightCommitment: 'confirmed'
            });
            return res.status(200).json({
                success: true,
                message: 'Transaction submitted successfully',
                signature
            });
        }
        // If no pre-signed transaction is provided, we would build and sign it here
        // This is just a placeholder - in a real app, you'd need to handle this case
        return res.status(400).json({ error: 'No signed transaction provided' });
    }
    catch (error) {
        console.error('Error relaying transaction:', error);
        return res.status(500).json({ error: 'Server error during transaction relay' });
    }
};
exports.relayTransaction = relayTransaction;
exports.default = {
    verifySessionKey: exports.verifySessionKey,
    registerSessionKey: exports.registerSessionKey,
    revokeSession: exports.revokeSession,
    relayTransaction: exports.relayTransaction
};
