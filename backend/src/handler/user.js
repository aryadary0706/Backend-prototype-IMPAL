import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import 'dotenv/config';
import { authenticateToken } from "../middleware/authmiddleware.js";
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req, res) => {
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
}

export const register = async (req, res) => {
    const { email, name, password } = req.body;
      try {
        // Cek email sudah ada atau belum
        const exist = await prisma.user.findUnique({ where: { email } });
        if (exist) return res.status(400).json({ message: "Email sudah terdaftar" });
    
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // const hashedPassword = password; // Untuk demo, simpan password apa adanya
    
        // Simpan user
        await prisma.user.create({
          data: {
            id: uuidv4(),
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
}