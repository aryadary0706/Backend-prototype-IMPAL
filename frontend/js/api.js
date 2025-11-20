// API Base URL
const API_URL = 'http://localhost:3000';

// Wrapper fetch dengan error handling
export async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Terjadi kesalahan');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Register user
export async function register(name, email, password) {
  return apiCall('/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

// Login user
export async function login(email, password) {
  return apiCall('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Save token ke localStorage
export function saveToken(token) {
  localStorage.setItem('token', token);
}

// Get token dari localStorage
export function getToken() {
  return localStorage.getItem('token');
}

// Remove token
export function removeToken() {
  localStorage.removeItem('token');
}

// Decode JWT untuk mendapatkan user info (basic decode, tanpa validasi)
export function getUserFromToken() {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}