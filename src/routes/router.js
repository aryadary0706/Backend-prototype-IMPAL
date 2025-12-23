import express from "express";
import multer from 'multer';
import { authenticateToken } from "../middleware/authmiddleware.js";
import { login, register } from "../handler/user.js";
import { getUserHistory, deleteHistoryItem } from "../handler/history.js";
import { uploadIdentification } from "../handler/identification.js"; 

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GANTI 'app' MENJADI 'router'
router.post("/register", register);
router.post("/login", login);

// Tambahkan authenticateToken di sini agar req.user tersedia di handler
router.post("/identification", authenticateToken, upload.single('image'), uploadIdentification);

router.get("/history", authenticateToken, getUserHistory);
router.delete("/history/:id", authenticateToken, deleteHistoryItem);

export default router;