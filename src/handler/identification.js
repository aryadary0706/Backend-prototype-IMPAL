import { prisma, supabase } from "../db.js";
import 'dotenv/config';

export const uploadIdentification = async (req, res) => {
  try {
    const userId = req.user.userId; 
    const { plantName, diseaseName, diseaseDescription, confidenceScore, TreatmentAdvice, isHealthy } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "File gambar tidak ditemukan!" });
    if (!userId) return res.status(400).json({ error: "User belum login!" });

    let Tempfilename = isHealthy ? 'healthy-' + file.originalname.toLowerCase().replace(/\s+/g, '-') : 'disease-' + file.originalname.toLowerCase().replace(/\s+/g, '-');
    let TempfilePath = isHealthy ? `identifications/${userId}/healthy/${Tempfilename}` : `identifications/${userId}/disease/${Tempfilename}`;

    const fileName = Tempfilename;
    const filePath = TempfilePath;

    const { error: uploadError } = await supabase.storage
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
    let identification;
    await prisma.$transaction(async (tx) => {
      identification = await tx.identification.create({
        data: {
          userId,
          imagePath: urlData.publicUrl,
          plantName: plantName || "PROTOTYPE",
          diseaseName: diseaseName || "PROTOTYPE",
          diseaseDescription: diseaseDescription || "Data manual (AI belum aktif)",
          confidenceScore: parseFloat(confidenceScore) || 0.0,
          TreatmentAdvice: TreatmentAdvice ||"Data manual (AI belum aktif)",
          isHealthy: false
        }
      });

      const history = await tx.historyManager.create({
        data: {
          userId,
          resultId: identification.id
        }
      });

      if (!history) {
        throw new Error("History gagal dibuat");
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
}