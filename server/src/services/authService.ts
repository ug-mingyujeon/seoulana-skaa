import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel';
import authConfig from '../config/auth';
import { Secret, SignOptions } from 'jsonwebtoken';

// Create OAuth client
const client = new OAuth2Client(authConfig.google.clientID);

export const verifyGoogleToken = async (token: string) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: authConfig.google.clientID
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Empty payload');
    }
    
    return payload;
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw error;
  }
};

export const findOrCreateUser = async (googlePayload: any) => {
  try {
    const { sub: googleId, email, name, picture } = googlePayload;
    
    // Check if user exists
    let user = await UserModel.findByGoogleId(googleId);
    
    if (user) {
      return user;
    }
    
    // Check if email is already registered
    if (email) {
      user = await UserModel.findByEmail(email);
      
      if (user) {
        // Update existing user with Google info
        user = await UserModel.update(user.id, { googleId });
        return user;
      }
    }
    
    // Create new user
    const newUser = await UserModel.create({
      email: email || `user_${googleId}@example.com`,
      displayName: name || email || 'User',
      googleId,
      photo: picture
    });
    
    return newUser;
  } catch (error) {
    console.error('Error finding or creating user:', error);
    throw error;
  }
};

export const generateToken = (userId: string) => {
  const options: SignOptions = { expiresIn: authConfig.jwt.expiresIn };
  return jwt.sign(
    { id: userId },
    authConfig.jwt.secret as Secret,
    options
  );
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, authConfig.jwt.secret) as { id: string };
  } catch (error) {
    return null;
  }
}; 