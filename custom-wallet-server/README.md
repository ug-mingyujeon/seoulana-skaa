# Custom Wallet Server for Solana Games

A custom wallet server implementation with Google OAuth authentication for Solana-based games. This server enables user authentication, wallet generation, transaction signing, and token minting for in-game NFTs and tokens.

## Features

- **Google OAuth Authentication**: Users can login with their Google accounts
- **Wallet Generation**: Server automatically generates a Solana wallet for each authenticated user
- **Session Management**: Maintains user sessions with cookies
- **Transaction Signing**: Securely sign transactions on behalf of users
- **Token Minting**: Mint game tokens and NFTs for authenticated users
- **Security**: Secure cookies, CSRF protection, and authentication verification

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google OAuth credentials (Client ID and Client Secret)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd custom-wallet-server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   SESSION_SECRET=your_session_secret
   REDIRECT_URL=http://localhost:3000/auth/google/callback
   ```

   To get Google OAuth credentials:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Create "OAuth client ID" credentials
   - Add authorized redirect URIs (e.g., `http://localhost:3000/auth/google/callback`)

### Starting the Server

Using the script:
```
./start-server.sh
```

Or manually:
```
npm start
```

For development with auto-restart:
```
npm run dev
```

## API Endpoints

### Authentication

- **GET /auth/google**: Initiate Google OAuth login
- **POST /auth/google**: Check authentication status and get redirect URL if not authenticated
- **GET /auth/google/callback**: Handle Google OAuth callback
- **GET /check-auth**: Check if user is authenticated
- **GET /logout**: Logout user and clear cookies

### Wallet Operations

- **POST /sign-transaction**: Sign a transaction for the authenticated user
- **POST /mint-token**: Mint a token for the authenticated user

## Integration with Games

### Client-side Authentication

```javascript
// Example in a game client
async function connectCustomWallet() {
  try {
    // Send POST request to check authentication
    const response = await fetch('http://localhost:3000/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientInfo: 'Game Client v1.0'
      }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      // User is already authenticated
      console.log('Already authenticated:', data.user);
      return data;
    } else if (data.redirectUrl) {
      // Open popup for authentication
      const authWindow = window.open(
        `http://localhost:3000${data.redirectUrl}`,
        'Auth Window',
        'width=600,height=600'
      );
      
      // Listen for messages from popup
      return new Promise((resolve) => {
        window.addEventListener('message', function handleAuthMessage(event) {
          if (event.data.type === 'auth-success') {
            window.removeEventListener('message', handleAuthMessage);
            resolve(event.data);
          }
        });
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}
```

### Checking Authentication Status

```javascript
async function checkAuthStatus() {
  const response = await fetch('http://localhost:3000/check-auth', {
    credentials: 'include'
  });
  
  return await response.json();
}
```

### Cookie Authentication

The server sets two cookies after successful authentication:
- `user_email`: HTTP-only secure cookie for server verification
- `game_user_email`: JavaScript-accessible cookie for client-side checks

```javascript
function checkEmailCookieValid() {
  const gameUserEmail = getCookie('game_user_email');
  return !!gameUserEmail && gameUserEmail.includes('@');
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}
```

## Security Considerations

- Uses HTTP-only cookies for sensitive data
- Implements CSRF protection
- Secure wallet key management
- Authentication checks for all sensitive operations
- In-memory storage for demo purposes (use a database for production)

## License

[MIT License](LICENSE)