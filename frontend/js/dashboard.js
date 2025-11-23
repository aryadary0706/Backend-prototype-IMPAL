import { getToken, getUserFromToken, removeToken } from './api.js';


const input = document.getElementById('image-upload');
const gallery = document.getElementById('gallery');

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

input.addEventListener('change', function () {
  gallery.innerHTML = ""; // reset preview

  Array.from(this.files).forEach(file => {
    if (!file.type.startsWith("image/")) return;

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    gallery.appendChild(img);
  });
});