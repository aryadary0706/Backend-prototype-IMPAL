import { getToken, getUserFromToken, removeToken } from './api.js';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadToSupabase(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await supabase.storage
    .from("plant-images")
    .upload(filePath, file);

  if (error) {
    console.error(error);
    alert("Gagal upload ke storage");
    return null;
  }

  // Ambil URL public
  const { data: publicUrl } = supabase.storage
    .from("plant-images")
    .getPublicUrl(filePath);

  return publicUrl.publicUrl; // ← Ini yang disimpan ke database
}


// === SEND TO BACKEND ===
document.getElementById("submit-btn").addEventListener("click", async () => {
  if (!selectedFile) {
    alert("Silakan pilih gambar dulu!");
    return;
  }

  const base64 = await toBase64(selectedFile);

  // 2️⃣ Kirim data ke backend
  const payload = {
    userId: user.userId || user.id, // tergantung jwt kamu
    imagePath: imageUrl,
    plantName: "Belum diketahui",
    diseaseName: "Belum diketahui",
    diseaseDescription: "Belum diketahui",
    confidenceScore: 0,
    imageBase64: base64
  };

  const res = await fetch("http://localhost:3000/identification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const result = await res.json();
  console.log(result);
  alert("Upload dan penyimpanan berhasil!");
});