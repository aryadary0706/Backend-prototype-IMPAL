import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client"; 
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import { authenticateToken } from "../middleware/authmiddleware";
import { login,register } from "../handler/user"
import { getUserHistory, deleteHistoryItem } from "../handler/history";
import { uploadIdentification } from "../handler/identification";

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const upload = multer({ storage: multer.memoryStorage() });

// ---------------- REGISTER ----------------
app.post("/register", register);
// ---------------- LOGIN ----------------
app.post("/login", login);


// CREATE IDENTIFICATION (Masuk ke user.identifications[])
app.post("/identification", upload.single('image'), uploadIdentification);


// HISTORY — READ ALL IDENTIFICATIONS BY USER
app.get("/history", authenticateToken, getUserHistory);


// HISTORY — DELETE 1 IDENTIFICATION (BY ID)
app.delete("/history/:id", authenticateToken,deleteHistoryItem);

// ---------------- START SERVER ----------------
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
