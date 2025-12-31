import {
  getDiseaseDetailsWithFallback,
  getDiseaseSolutionWithFallback,
  normalizeDiseaseGroup,
} from "../utils/diseaseSolutions.js";

export const getDiseaseDetails = async (req, res) => {
  try {
    const raw =
      (typeof req.query.disease === "string" ? req.query.disease : null) ??
      (typeof req.query.name === "string" ? req.query.name : null) ??
      (typeof req.query.diseaseName === "string" ? req.query.diseaseName : null);

    if (!raw || !raw.trim()) {
      return res.status(400).json({ error: "Parameter 'disease' wajib diisi" });
    }

    const diseaseGroup = normalizeDiseaseGroup(raw) || raw.trim();
    const details = getDiseaseDetailsWithFallback(raw);
    const solution = getDiseaseSolutionWithFallback(raw);

    return res.json({
      diseaseGroup,
      solution,
      treatment: details.treatment,
      symptoms: details.symptoms,
    });
  } catch (err) {
    return res.status(500).json({ error: "Gagal mengambil disease details", details: err?.message });
  }
};
