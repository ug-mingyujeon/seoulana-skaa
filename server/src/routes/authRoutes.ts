import express from 'express';
import { googleLogin, getUserInfo } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Authenticate with Google token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID token
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Authentication failed
 */
router.post('/google', googleLogin);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticate, getUserInfo);

export default router; 