import { prisma, supabase } from "../db.js";
import 'dotenv/config';

export const getUserHistory = async (req, res) => {
  try {    
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID tidak ditemukan dalam token" });
    }

    const history = await prisma.identification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    console.log('History found:', history.length, 'items'); // Log results

    res.json({
      message: "History ditemukan",
      total: history.length,
      data: history
    });
  } catch (err) {
    console.error('Full error in getUserHistory:', err); // This will show the actual error
    console.error('Error stack:', err.stack); // Show stack trace
    res.status(500).json({ 
      error: "Gagal mengambil history",
      details: err.message // Send error details to frontend for debugging
    });
  }
}

export const deleteHistoryItem = async (req, res) => {
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
}