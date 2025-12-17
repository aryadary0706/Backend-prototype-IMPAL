import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
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
const JWT_SECRET = process.env.JWT_SECRET

// ---------------- START SERVER ----------------
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
