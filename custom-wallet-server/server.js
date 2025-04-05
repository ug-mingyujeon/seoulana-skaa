require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Keypair } = require('@solana/web3.js');
const path = require('path');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Enable CORS with credentials support
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'http://localhost:5500', 
    'http://127.0.0.1:5500'
  ],
  credentials: true
}));

// Configure session
app.use(session({
  secret: process.env.SESSION_SECRET || 'test-session-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// User storage (in-memory for demo purposes)
// In production, use a database
const users = {};

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users[id];
  done(null, user);
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.REDIRECT_URL || 'http://localhost:3000/auth/google/callback'
  },
  (accessToken, refreshToken, profile, done) => {
    // Check if user exists
    if (users[profile.id]) {
      return done(null, users[profile.id]);
    }
    
    // Generate a Solana wallet for the user
    const wallet = Keypair.generate();
    
    // Create new user
    const user = {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails[0].value,
      accessToken,
      wallet: {
        publicKey: wallet.publicKey.toString(),
        secretKey: wallet.secretKey,
      }
    };
    
    // Store user
    users[profile.id] = user;
    return done(null, user);
  }
));

// Authentication routes
app.get('/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.post('/auth/google', (req, res) => {
  console.log('Auth request received:', req.body?.clientInfo || 'No client info');
  
  if (req.isAuthenticated()) {
    // User is already authenticated, send direct response
    const user = req.user;
    res.json({
      success: true,
      publicKey: user.wallet.publicKey,
      token: user.accessToken,
      user: {
        id: user.id,
        name: user.displayName,
        email: user.email
      }
    });
  } else {
    // User needs to authenticate, send redirect URL
    const redirectUrl = '/auth/google';
    res.json({ redirectUrl });
  }
});

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Set cookies after successful authentication
    res.cookie('user_email', req.user.email, {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    res.cookie('game_user_email', req.user.email, {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: false, // Accessible from JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // Render success page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Success</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #1a1a2e;
            color: #e6e6e6;
            padding: 20px;
            text-align: center;
          }
          h2 {
            color: #4ecca3;
          }
          .wallet-key {
            background-color: #232333;
            padding: 10px;
            border-radius: 5px;
            word-break: break-all;
            margin: 10px 0;
            font-family: monospace;
          }
          .success-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #242442;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
        </style>
        <script>
          // Send message to parent window when auth is complete
          window.onload = function() {
            const data = {
              type: 'auth-success',
              publicKey: '${req.user.wallet.publicKey}',
              token: '${req.user.accessToken}',
              user: {
                id: '${req.user.id}',
                name: '${req.user.displayName}',
                email: '${req.user.email}'
              }
            };
            
            // Send postMessage to parent
            window.opener.postMessage(data, '*');
            
            // Close window after a short delay
            setTimeout(() => {
              window.close();
            }, 5000);
          };
        </script>
      </head>
      <body>
        <div class="success-container">
          <h2>인증 성공!</h2>
          <p>Google 로그인이 성공적으로 완료되었습니다.</p>
          <p>사용자: ${req.user.displayName}</p>
          <p>이메일: ${req.user.email}</p>
          <p>지갑 주소:</p>
          <div class="wallet-key">${req.user.wallet.publicKey}</div>
          <p>쿠키 설정됨: user_email, game_user_email (24시간 유효)</p>
          <p>이 창은 자동으로 닫히고 게임으로 돌아갑니다.</p>
        </div>
      </body>
      </html>
    `);
  }
);

// Check auth status route
app.get('/check-auth', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ 
      authenticated: true, 
      user: {
        id: req.user.id,
        name: req.user.displayName,
        email: req.user.email
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) { return next(err); }
    
    // Clear cookies
    res.clearCookie('user_email');
    res.clearCookie('game_user_email');
    
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Transaction signing endpoint
app.post('/sign-transaction', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { transaction } = req.body;
  
  if (!transaction) {
    return res.status(400).json({ error: 'No transaction provided' });
  }
  
  try {
    // Logic to sign the transaction would go here
    // This is a simplified example
    const signature = 'simulated_signature_' + Date.now();
    
    res.json({
      success: true,
      signature,
      message: 'Transaction signed successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to sign transaction',
      details: error.message
    });
  }
});

// Token minting endpoint
app.post('/mint-token', (req, res) => {
  if (!req.isAuthenticated() && !req.cookies.user_email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    // Token minting logic would go here
    // This is a simplified example
    const tokenId = 'token_' + Date.now();
    
    res.json({
      success: true,
      tokenId,
      recipient: req.user?.wallet.publicKey || 'authenticated_user',
      message: 'Token minted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to mint token',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Google Auth: ${process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Not configured'}`);
}); 