import { getToken, getUserFromToken, removeToken } from './api.js';

const input = document.getElementById('image-upload');
const gallery = document.getElementById('gallery');
let selectedFile = null;

// Check authentication
const token = getToken();
if (!token) {
  window.location.href = 'index.html';
}

// Display user info
const user = getUserFromToken();
if (user) {
  document.getElementById('user-name').textContent = user.name ||"pengguna";
}

// Logout button
document.getElementById('logout-btn').addEventListener('click', () => {
  removeToken();
  window.location.href = 'index.html';
});

// Preview gambar
input.addEventListener('change', function () {
  gallery.innerHTML = "";
  selectedFile = this.files[0];

  if (!selectedFile || !selectedFile.type.startsWith("image/")) return;

  const img = document.createElement("img");
  img.src = URL.createObjectURL(selectedFile);
  img.style.width = "150px";
  gallery.appendChild(img);
});

// === SEND TO BACKEND ===
// Hapus baris supabaseUrl, supabaseKey, dan window.supabase.createClient

document.getElementById("submit-btn").addEventListener("click", async () => {
  if (!selectedFile) {
    alert("Silakan pilih gambar dulu!");
    return;
  }

  const user = getUserFromToken();
  
  // Gunakan FormData untuk mengirim file + teks
  const formData = new FormData();
  formData.append('image', selectedFile); // 'image' harus sama dengan upload.single('image') di backend
  formData.append('userId', user.userId || user.id);
  formData.append('plantName', "Belum diketahui");
  formData.append('diseaseName', "Belum diketahui");
  formData.append('diseaseDescription', "Belum diketahui");
  formData.append('confidenceScore', 0);

  try {
    const res = await fetch("http://localhost:3000/identification", {
      method: "POST",
      // Jangan set Content-Type header secara manual saat menggunakan FormData
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData 
    });

    const result = await res.json();
    console.log(result);
    alert("Berhasil disimpan ke database via backend!");
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan saat upload.");
  }
});
