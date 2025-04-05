// Config - Replace with your actual backend URL
const API_URL = 'http://localhost:3000';

// DOM Elements
const loginSection = document.getElementById('login-section');
const profileSection = document.getElementById('profile-section');
const apiTestSection = document.getElementById('api-test-section');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userId = document.getElementById('user-id');
const profilePic = document.getElementById('profile-pic');
const logoutBtn = document.getElementById('logout-btn');
const testApiBtn = document.getElementById('test-api-btn');
const apiResponse = document.getElementById('api-response');

// Check if user is already logged in
function checkAuthStatus() {
  const token = localStorage.getItem('auth_token');
  if (token) {
    // Show logged in UI
    loginSection.classList.add('hidden');
    profileSection.classList.remove('hidden');
    apiTestSection.classList.remove('hidden');
    
    // Load user info from localStorage
    const user = JSON.parse(localStorage.getItem('user_info') || '{}');
    if (user) {
      userName.textContent = user.displayName || 'User';
      userEmail.textContent = user.email || 'N/A';
      userId.textContent = user.id || 'N/A';
      profilePic.src = user.photo || 'https://via.placeholder.com/100';
    }
  }
}

// Handle Google Sign-In
window.handleCredentialResponse = async (response) => {
  try {
    // Google returns an ID token
    const token = response.credential;
    
    // Send token to backend for verification
    const resp = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });
    
    if (!resp.ok) {
      throw new Error('Login failed');
    }
    
    const data = await resp.json();
    
    // Save auth token and user info
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user_info', JSON.stringify(data.user));
    
    // Update UI
    userName.textContent = data.user.displayName;
    userEmail.textContent = data.user.email;
    userId.textContent = data.user.id;
    profilePic.src = data.user.photo || 'https://via.placeholder.com/100';
    
    // Show logged in UI
    loginSection.classList.add('hidden');
    profileSection.classList.remove('hidden');
    apiTestSection.classList.remove('hidden');
    
    console.log('Login successful!', data);
  } catch (error) {
    console.error('Authentication error:', error);
    alert('Authentication failed: ' + error.message);
  }
};

// Logout
logoutBtn.addEventListener('click', () => {
  // Clear local storage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_info');
  
  // Show login UI
  profileSection.classList.add('hidden');
  apiTestSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
  
  // Reload to reset Google Sign-In state
  window.location.reload();
});

// Test API endpoint
testApiBtn.addEventListener('click', async () => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    apiResponse.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    apiResponse.classList.add('success');
  } catch (error) {
    console.error('API request failed:', error);
    apiResponse.textContent = `Error: ${error.message}`;
    apiResponse.classList.add('error');
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', checkAuthStatus); 