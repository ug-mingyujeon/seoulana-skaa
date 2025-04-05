import { Request, Response } from 'express';
import { verifyGoogleToken, findOrCreateUser, generateToken } from '../services/authService';

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    // Verify Google token
    const googlePayload = await verifyGoogleToken(token);
    
    // Find or create user
    const user = await findOrCreateUser(googlePayload);
    
    if (!user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }
    
    // Generate JWT token
    const jwtToken = generateToken(user.id);
    
    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photo: user.photo
      }
    });
  } catch (error) {
    console.error('Error in Google login:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const getUserInfo = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    res.json({ user: req.user });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ error: 'Server error' });
  }
}; 