"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Navbar from "@/components/navbar";
import { getToken, getUserFromToken } from "@/lib/token";
import { requestInference } from "@/lib/api";
import tipImage1 from "@/assets/step_1.png";

type NormalizedInference = {
  plantName: string;
  diseaseName: string;
  diseaseDescription: string;
  confidenceScore: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function normalizeInference(result: unknown): NormalizedInference {
  const fallback: NormalizedInference = {
    plantName: "Belum diketahui",
    diseaseName: "Belum diketahui",
    diseaseDescription: "Belum diketahui",
    confidenceScore: 0,
  };

  if (!isRecord(result)) return fallback;

  const plantName = pickString(result, ["plantName", "plant", "plant_name", "crop", "cropName"]);
  const diseaseName = pickString(result, [
    "diseaseName",
    "disease",
    "disease_name",
    "label",
    "class",
    "predicted_class",
  ]);
  const diseaseDescription = pickString(result, ["diseaseDescription", "description", "details"]);
  const confidenceScore = pickNumber(result, [
    "confidenceScore",
    "confidence",
    "score",
    "probability",
  ]);

  return {
    plantName: plantName ?? fallback.plantName,
    diseaseName: diseaseName ?? fallback.diseaseName,
    diseaseDescription: diseaseDescription ?? fallback.diseaseDescription,
    confidenceScore: confidenceScore ?? fallback.confidenceScore,
  };
}

type StoredInference = {
  class_name?: string;
  disease?: string;
  confidence?: number;
  solution?: string;
  crop_name?: string;
  plantName?: string;
  disease_display?: string;
  diseaseName?: string;
  disease_group?: string;
  treatment?: {
    organic?: string[];
    chemical?: string[];
    cultural?: string[];
  };
  symptoms?: string[];
  warning?: {
    type?: string;
    message?: string;
    threshold?: number;
  };
  is_low_confidence?: boolean;
  low_confidence_threshold?: number;
};

function toStoredInference(value: unknown): StoredInference {
  if (!isRecord(value)) return {};

  const class_name = typeof value.class_name === "string" ? value.class_name : undefined;
  const disease = typeof value.disease === "string" ? value.disease : undefined;
  const solution = typeof value.solution === "string" ? value.solution : undefined;

  const crop_name = typeof value.crop_name === 'string' ? value.crop_name : undefined;
  const plantName = typeof value.plantName === 'string' ? value.plantName : undefined;
  const disease_display = typeof value.disease_display === 'string' ? value.disease_display : undefined;
  const diseaseName = typeof value.diseaseName === 'string' ? value.diseaseName : undefined;
  const disease_group = typeof value.disease_group === 'string' ? value.disease_group : undefined;

  const treatmentRaw = value.treatment;
  const treatment =
    typeof treatmentRaw === 'object' && treatmentRaw !== null
      ? {
          organic: Array.isArray((treatmentRaw as Record<string, unknown>).organic)
            ? ((treatmentRaw as Record<string, unknown>).organic as unknown[]).filter((x): x is string => typeof x === 'string')
            : undefined,
          chemical: Array.isArray((treatmentRaw as Record<string, unknown>).chemical)
            ? ((treatmentRaw as Record<string, unknown>).chemical as unknown[]).filter((x): x is string => typeof x === 'string')
            : undefined,
          cultural: Array.isArray((treatmentRaw as Record<string, unknown>).cultural)
            ? ((treatmentRaw as Record<string, unknown>).cultural as unknown[]).filter((x): x is string => typeof x === 'string')
            : undefined,
        }
      : undefined;

  const symptoms = Array.isArray(value.symptoms)
    ? (value.symptoms as unknown[]).filter((x): x is string => typeof x === 'string')
    : undefined;

  const warningRaw = value.warning;
  const warning =
    typeof warningRaw === 'object' && warningRaw !== null
      ? {
          type: typeof (warningRaw as Record<string, unknown>).type === 'string' ? String((warningRaw as Record<string, unknown>).type) : undefined,
          message:
            typeof (warningRaw as Record<string, unknown>).message === 'string'
              ? String((warningRaw as Record<string, unknown>).message)
              : undefined,
          threshold:
            typeof (warningRaw as Record<string, unknown>).threshold === 'number'
              ? (warningRaw as Record<string, unknown>).threshold as number
              : typeof (warningRaw as Record<string, unknown>).threshold === 'string'
                ? Number((warningRaw as Record<string, unknown>).threshold)
                : undefined,
        }
      : undefined;

  const is_low_confidence = typeof value.is_low_confidence === 'boolean' ? value.is_low_confidence : undefined;
  const low_confidence_threshold =
    typeof value.low_confidence_threshold === 'number'
      ? value.low_confidence_threshold
      : typeof value.low_confidence_threshold === 'string'
        ? Number(value.low_confidence_threshold)
        : undefined;

  const confidenceRaw = value.confidence;
  const confidence =
    typeof confidenceRaw === "number"
      ? confidenceRaw
      : typeof confidenceRaw === "string"
        ? Number(confidenceRaw)
        : undefined;

  return {
    class_name,
    disease,
    solution,
    crop_name,
    plantName,
    disease_display,
    diseaseName,
    disease_group,
    treatment,
    symptoms,
    warning,
    is_low_confidence,
    low_confidence_threshold,
    confidence: Number.isFinite(confidence as number) ? (confidence as number) : undefined,
  };
}

export default function DashboardPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const token = useMemo(() => getToken(), []);

  useEffect(() => {
    if (!token) {
      window.location.href = "/";
    }
  }, [token]);

  useEffect(() => {
    if (!selectedFile) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile]);

  function onFilePicked(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setSelectedFile(file);
    setNotice(null);
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    if (!selectedFile) {
      setNotice({ type: "error", text: "Silakan pilih gambar dulu!" });
      return;
    }
    if (!token) {
      window.location.href = "/";
      return;
    }

    const user = getUserFromToken(token);
    const userId = (user?.userId ?? user?.id) as string | number | undefined;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

    try {
      setIsSubmitting(true);
      setNotice(null);
      setProgress(10);
      setProgressText("Meminta AI inference...");
      const inferenceRaw = await requestInference(selectedFile, token);
      setProgress(55);
      setProgressText("Menyimpan hasil...");
      const inference = normalizeInference(inferenceRaw);
      sessionStorage.setItem(
        "latest_inference",
        JSON.stringify(toStoredInference(inferenceRaw))
      );

      const formData = new FormData();
      formData.append("image", selectedFile);
      if (userId !== undefined) formData.append("userId", String(userId));
      formData.append("plantName", inference.plantName);
      formData.append("diseaseName", inference.diseaseName);
      formData.append("diseaseDescription", inference.diseaseDescription);
      formData.append("confidenceScore", String(inference.confidenceScore));

      const res = await fetch(`${apiUrl}/identification`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      setProgress(85);

      const result: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "message" in result &&
          typeof (result as Record<string, unknown>).message === "string"
            ? String((result as Record<string, unknown>).message)
            : "Terjadi kesalahan saat upload.";
        throw new Error(message);
      }

      if (
        typeof result === "object" &&
        result !== null &&
        "identification" in result &&
        typeof (result as Record<string, unknown>).identification === "object" &&
        (result as Record<string, unknown>).identification !== null
      ) {
        const identification = (result as Record<string, unknown>).identification as Record<
          string,
          unknown
        >;
        const imagePath = identification.imagePath;
        if (typeof imagePath === "string" && imagePath.trim()) {
          sessionStorage.setItem("latest_image_url", imagePath);
        }
      }

      console.log(result);
      setProgress(100);
      setProgressText("Selesai");
      setNotice({ type: "success", text: "Berhasil! Mengalihkan ke hasil..." });
      setTimeout(() => {
        window.location.href = "/result";
      }, 600);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat upload.";
      setNotice({ type: "error", text: message });
    } finally {
      setIsSubmitting(false);
      setProgress(0);
      setProgressText("");
    }
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="upload-section dashboard-title" role="region" aria-label="Call to action">
          <h2 className="dashboard-cta">Cek Penyakit Tanaman Anda di Sini!</h2>
        </div>

        <div className="dashboard-layout">
          <div className="upload-section dashboard-left">
            <div style={{ margin: "6px auto 0", maxWidth: 420 }}>
              <h3 className="tips-panel-title">
                Hal-hal yang perlu diperhatikan sebelum mengunggah gambar
              </h3>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <Image
                  src={tipImage1}
                  alt="Panduan foto tanaman"
                  width={320}
                  height={186}
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    height: "auto",
                    objectFit: "contain",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                  }}
                />
              </div>

              <div className="tips-grid" aria-label="Tips foto yang bagus">
                <div className="tip-card">
                  <div className="tip-card__title">1.</div>
                  <div className="tip-card__text">
                    Foto di tempat terang dan pastikan fokus (tidak blur).
                  </div>
                </div>

                <div className="tip-card">
                  <div className="tip-card__title">2.</div>
                  <div className="tip-card__text">
                    Ambil jarak dekat dan isi frame dengan bagian daun yang sakit.
                  </div>
                </div>

                <div className="tip-card">
                  <div className="tip-card__title">3.</div>
                  <div className="tip-card__text">
                    Gunakan latar belakang sederhana agar objek daun terlihat jelas.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="upload-section dashboard-right">
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={(e) => onFilePicked(e.target.files?.[0])}
            />

            <label
              htmlFor="image-upload"
              className={`upload-area${dragOver ? " dragover" : ""}`}
              id="upload-area"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                onFilePicked(e.dataTransfer.files?.[0]);
              }}
            >
              <div className="upload-icon">🖼️</div>
              <div className="upload-text">
                Drop gambar anda disini atau <strong>di file anda</strong>
              </div>
              <div className="upload-subtext">Supports JPG, JPEG, PNG</div>
            </label>

            <div id="gallery" className="gallery">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  width={120}
                  height={120}
                  unoptimized
                  style={{ objectFit: "cover", borderRadius: 10, border: "2px solid #d5f5e3" }}
                />
              ) : null}
            </div>

            {isSubmitting ? (
              <div style={{ width: "100%", maxWidth: 520, margin: "10px auto 0" }}>
                <div
                  role="progressbar"
                  aria-label="Upload progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  style={{
                    width: "100%",
                    height: 10,
                    background: "#e5e7eb",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      background: "#5C9700",
                      transition: "width 200ms ease",
                    }}
                  />
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>
                  {progressText}
                </div>
              </div>
            ) : null}

            {notice ? (
              <p
                className={notice.type === "error" ? "error" : "success"}
                style={{ textAlign: "center" }}
                role={notice.type === "error" ? "alert" : "status"}
              >
                {notice.text}
              </p>
            ) : null}

            <button id="submit-btn" onClick={handleSubmit} disabled={isSubmitting || !selectedFile}>
              {isSubmitting ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
