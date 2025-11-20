import { getToken, getUserFromToken, removeToken } from './api.js';

// Check authentication
const token = getToken();
if (!token) {
  window.location.href = 'index.html';
}

// Display user info
const user = getUserFromToken();
if (user) {
  document.getElementById('user-name').textContent = user.email;
}

// Logout button
document.getElementById('logout-btn').addEventListener('click', () => {
  removeToken();
  window.location.href = 'index.html';
});