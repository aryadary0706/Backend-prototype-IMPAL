export const uploadIdentification = async (req, res) => {
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
}