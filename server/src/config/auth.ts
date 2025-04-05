import { Secret } from 'jsonwebtoken';

export default {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || '796469952731-b1356mo8jogv84n75tvdu3v9ck1f0hm7.apps.googleusercontent.com'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'random',
    expiresIn: 86400 // 1 day in seconds
  }
}; 