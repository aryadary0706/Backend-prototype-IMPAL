import express from "express";
import multer from 'multer';
import { authenticateToken } from "../middleware/authmiddleware.js";
import { login, register } from "../handler/user.js";
import { getUserHistory, deleteHistoryItem } from "../handler/history.js";
import { getDiseaseDetails } from "../handler/disease.js";
import { uploadIdentification } from "../handler/identification.js"; 
import { requestAiInference } from "../handler/inference.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GANTI 'app' MENJADI 'router'
router.post("/auth/register", register);
router.post("/auth/login", login);

// Tambahkan authenticateToken di sini agar req.user tersedia di handler
router.post("/identification", authenticateToken, upload.single('image'), uploadIdentification);

// Forward image to Modal inference API
router.post("/inference", authenticateToken, upload.single('image'), requestAiInference);

router.get("/history", authenticateToken, getUserHistory);
router.delete("/history/:id", authenticateToken, deleteHistoryItem);

router.get("/disease-details", authenticateToken, getDiseaseDetails);

export default router;