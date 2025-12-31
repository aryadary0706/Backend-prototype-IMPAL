import { prisma, supabase } from "../db.js";
import 'dotenv/config';
import { getDiseaseSolutionWithFallback } from '../utils/diseaseSolutions.js';

export const uploadIdentification = async (req, res) => {
  try {
    console.log('=== UPLOAD IDENTIFICATION START ===');
    console.log('req.user:', req.user);
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    
    const userId = req.user.userId; 
    const { plantName, diseaseName, diseaseDescription, confidenceScore } = req.body;
    const file = req.file;

    console.log('Parsed values:', { userId, plantName, diseaseName, file: !!file });

    if (!file) {
      return res.status(400).json({ error: "File gambar tidak ditemukan!" });
    }
    
    if (!userId) {
      return res.status(400).json({ error: "userId wajib" });
    }

    // 1. Upload ke Supabase Storage via Backend
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `identifications/${userId}/${fileName}`;

    console.log('Uploading to Supabase:', filePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("plant-image")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      throw uploadError;
    }

    console.log('✅ Supabase upload success:', uploadData);

    // 2. Dapatkan Public URL
    const { data: urlData } = supabase.storage
      .from("plant-image")
      .getPublicUrl(filePath);

    console.log('Public URL:', urlData.publicUrl);

    // 3. Simpan ke Database Prisma
    const identification = await prisma.identification.create({
      data: {
        userId,
        imagePath: urlData.publicUrl,
        plantName: plantName || "Belum diketahui",
        diseaseName: diseaseName || "Belum diketahui",
        diseaseDescription: diseaseDescription || "Belum diketahui",
        confidenceScore: parseFloat(confidenceScore) || 0.0,
        TreatmentAdvice: getDiseaseSolutionWithFallback(diseaseName || ""),
        isHealthy: false
      }
    });

    console.log('✅ Database save success:', identification.id);

    res.json({
      message: "Upload dan Identifikasi berhasil",
      identification
    });

  } catch (err) {
    console.error('❌ FULL ERROR:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      error: "Gagal memproses data",
      details: err.message
    });
  }
}