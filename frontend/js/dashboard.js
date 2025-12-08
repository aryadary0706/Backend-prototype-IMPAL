import { getToken, getUserFromToken, removeToken } from './api.js';

const supabaseUrl = "https://bvwaptvuvevujjhztelz.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2d2FwdHZ1dmV2dWpqaHp0ZWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTY1NDEsImV4cCI6MjA3OTQ5MjU0MX0._zoNR57LZg4rVATyzqxtllH8gsUaqwGdMSf8q6F7JrQ"

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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

async function uploadToSupabase(file) {
  const user =  getUserFromToken();
  const userId = user.userId;
  console.log(userId)
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `identifications/${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from("plant-image")
    .upload(filePath, file);

  if (error) {
    console.error(error);
    alert("Gagal upload ke Supabase Storage");
    return null;
  }

  const { data } = supabase.storage
    .from("plant-image")
    .getPublicUrl(filePath);

  return {
    publicUrl: data.publicUrl,
    filePath: filePath
  };
}

// === SEND TO BACKEND ===
document.getElementById("submit-btn").addEventListener("click", async () => {
  if (!selectedFile) {
    alert("Silakan pilih gambar dulu!");
    return;
  }

  // 1️⃣ Upload ke Supabase
  const uploaded = await uploadToSupabase(selectedFile);
  if (!uploaded) return;

  const { publicUrl, filePath } = uploaded;

  // 2️⃣ Kirim data ke backend
  const payload = {
    userId: user.userId || user.id,
    imagePath: filePath,          // ← relative path
    plantName: "Belum diketahui",
    diseaseName: "Belum diketahui",
    diseaseDescription: "Belum diketahui",
    confidenceScore: 0
  };

  const res = await fetch("http://localhost:3000/identification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const result = await res.json();
  console.log(result);
  alert("Upload berhasil! URL: " + publicUrl);
});
