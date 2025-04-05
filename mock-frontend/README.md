# Google OAuth2 Login Test - Mock Frontend

This is a simple mock frontend application for testing Google OAuth2 authentication with our backend server.

![Google OAuth2 Login Test Screenshot](https://github.com/user-attachments/assets/a047e868-1aa2-4d04-a802-948562f51f7a)

## Features

- Google Sign-In integration
- Display of user profile information after successful authentication
- JWT token-based authentication
- Protected API endpoint testing

## Setup

1. Make sure you have the backend server running at `http://localhost:3000`
2. Serve this frontend using any simple HTTP server

### Using Python's built-in HTTP server:

```bash
cd mock-frontend
python -m http.server 8080
```

### Using Node.js:

```bash
cd mock-frontend
npx http-server -p 8080
```

## How it Works

1. The application uses Google Identity Services (GSI) to handle the authentication flow
2. When a user clicks the Google Sign-In button, they authenticate with Google
3. Google returns an ID token that is sent to our backend server
4. The backend verifies the token with Google and creates/finds the user in our database
5. A JWT token is returned to the frontend for subsequent authenticated requests
6. The frontend stores this token in localStorage and uses it for API requests

## Configuration

The mock frontend is configured to connect to a backend server running at `http://localhost:3000`. If your backend is running on a different URL, update the `API_URL` constant in `js/auth.js`.

## Testing Protected Endpoints

After logging in:
1. Click the "Get User Info from API" button to test the protected endpoint
2. The response from the server will be displayed below the button

## Troubleshooting

If you encounter CORS errors:
- Make sure the backend server has CORS properly configured to allow requests from your frontend origin
- Check that your Google Cloud Console project has the correct JavaScript origins configured

If you encounter authentication errors:
- Verify that your Google Client ID is correctly set in both frontend and backend
- Check the browser console for more detailed error messages 