import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client"; 
import 'dotenv/config';

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());


// SECRET KEY untuk JWT
const JWT_SECRET = process.env.JWT_SECRET || "1028391279127390172390106438658023600234";

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
app.post("/identification", async (req, res) => {
  try {
    const {
      userId,
      plantName,
      diseaseName,
      diseaseDescription,
      confidenceScore,
    } = req.body;

    if (!imagePath) 
      return res.status(400).json({ error: "imagePath Tidak Ditemukan!" });

    if (!userId)
      return res.status(400).json({ error: "userId wajib" });

    // Simpan ke database Prisma
    const identification = await prisma.identification.create({
      data: {
        userId,
        imagePath: imageUrl,
        plantName: plantName || "belum diketahui",
        diseaseName: diseaseName || "belum diketahui",
        diseaseDescription: diseaseDescription || "belum diketahui",
        confidenceScore: parseFloat(confidenceScore) || 0.0
      }
    });

    res.json({
      message: "Identification berhasil dibuat",
      identification
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal membuat identification" });
  }
});


// HISTORY — READ ALL IDENTIFICATIONS BY USER
app.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

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
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil history" });
  }
});


// =======================================================
// HISTORY — DELETE 1 IDENTIFICATION (BY ID)
// =======================================================
app.delete("/history/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.identification.delete({
      where: { id }
    });

    res.json({
      message: "Identification berhasil dihapus",
      deletedId: id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menghapus data" });
  }
});

// ---------------- START SERVER ----------------
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
