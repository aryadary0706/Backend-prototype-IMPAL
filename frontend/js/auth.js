  import { register, login, saveToken } from './api.js';

  // Tab Switching
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    clearErrors();
  });

  registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
    clearErrors();
  });

  // Login Form Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
      const data = await login(email, password);
      saveToken(data.token);
      window.location.href = 'dashboard.html';
    } catch (error) {
      errorEl.textContent = error.message;
    }
  });

  // Register Form Submit
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorEl = document.getElementById('register-error');
    const successEl = document.getElementById('register-success');

    try {
      await register(name, email, password);
      successEl.textContent = 'Registrasi berhasil! Silakan login.';
      errorEl.textContent = '';
      
      // Auto-switch ke login tab setelah 1.5 detik
      setTimeout(() => {
        loginTab.click();
        document.getElementById('login-email').value = email;
      }, 1500);
    } catch (error) {
      errorEl.textContent = error.message;
      successEl.textContent = '';
    }
  });

  function clearErrors() {
    document.getElementById('login-error').textContent = '';
    document.getElementById('register-error').textContent = '';
    document.getElementById('register-success').textContent = '';
  }