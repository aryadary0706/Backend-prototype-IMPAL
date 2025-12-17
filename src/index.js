import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client"; 
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const upload = multer({ storage: multer.memoryStorage() });

// SECRET KEY untuk JWT
const JWT_SECRET = process.env.JWT_SECRET || "1028391279127390172390106438658023600234";

// ================ AUTHENTICATION ROUTES =================
// Middleware untuk proteksi route
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Akses ditolak, token hilang" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token tidak valid atau kadaluarsa" });
    req.user = user; // Data user dari token disimpan di req.user
    next();
  });
};

// ---------------- REGISTER ----------------
app.post("/register", async (req, res) => {
  const { email, name, password } = req.body;

  try {
    // Cek email sudah ada atau belum
    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) return res.status(400).json({ message: "Email sudah terdaftar" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user
    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "User berhasil terdaftar" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// ---------------- LOGIN ----------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Cek user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Email atau password salah" });

    // Cek password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Email atau password salah" });

    // Buat JWT Token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login sukses",
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});


// CREATE IDENTIFICATION (Masuk ke user.identifications[])
app.post("/identification", upload.single('image'), async (req, res) => {
  try {
    const { userId, plantName, diseaseName, diseaseDescription, confidenceScore } = req.body;
    const file = req.file; // Ini file dari frontend

    if (!file) return res.status(400).json({ error: "File gambar tidak ditemukan!" });
    if (!userId) return res.status(400).json({ error: "userId wajib" });

    // 1. Upload ke Supabase Storage via Backend
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `identifications/${userId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("plant-image")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) throw uploadError;

    // 2. Dapatkan Public URL
    const { data: urlData } = supabase.storage
      .from("plant-image")
      .getPublicUrl(filePath);

    // 3. Simpan ke Database Prisma
    const identification = await prisma.identification.create({
      data: {
        userId,
        imagePath: urlData.publicUrl, // Simpan URL publiknya
        plantName: plantName || "Belum diketahui",
        diseaseName: diseaseName || "Belum diketahui",
        diseaseDescription: diseaseDescription || "Belum diketahui",
        confidenceScore: parseFloat(confidenceScore) || 0.0
      }
    });

    res.json({
      message: "Upload dan Identifikasi berhasil",
      identification
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memproses data" });
  }
});


// HISTORY — READ ALL IDENTIFICATIONS BY USER
app.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Ambil ID dari token, bukan dari URL

    const history = await prisma.identification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      message: "History ditemukan",
      total: history.length,
      data: history
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil history" });
  }
});


// =======================================================
// HISTORY — DELETE 1 IDENTIFICATION (BY ID)
// =======================================================
app.delete("/history/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 1. Cari data dulu untuk mendapatkan path gambar dan verifikasi pemilik
    const item = await prisma.identification.findUnique({
      where: { id: id }
    });

    if (!item) return res.status(404).json({ error: "Data tidak ditemukan" });
    if (item.userId !== userId) return res.status(403).json({ error: "Anda tidak berhak menghapus data ini" });

    // 2. Hapus file di Supabase Storage
    // Kita perlu mengambil path relatif dari URL publik (atau simpan imagePath relatif di DB)
    const filePath = item.imagePath.split('/public/plant-image/')[1]; 
    if (filePath) {
      await supabase.storage.from("plant-image").remove([filePath]);
    }

    // 3. Hapus data di Prisma
    await prisma.identification.delete({
      where: { id }
    });

    res.json({ message: "Data dan gambar berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menghapus data" });
  }
});

// ---------------- START SERVER ----------------
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
