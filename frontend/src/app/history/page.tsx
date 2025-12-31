"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { getToken } from "@/lib/token";
import { deleteHistoryItem, fetchHistory } from "@/lib/api";
import emptyImage from "@/assets/I2.jpg";

type HistoryItem = {
  id: string;
  imagePath: string;
  plantName?: string | null;
  diseaseName?: string | null;
  diseaseDescription?: string | null;
  TreatmentAdvice?: string | null;
  confidenceScore?: number | null;
  createdAt: string;
};

function formatConfidence(value: number | null | undefined): string {
  const score = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const percent = score <= 1 ? score * 100 : score;
  return `${percent.toFixed(1)}%`;
}

function formatDateId(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const token = useMemo(() => getToken(), []);
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  function openResultFromHistory(item: HistoryItem) {
    if (typeof window === "undefined") return;

    const inferred = {
      plantName: item.plantName ?? undefined,
      diseaseName: item.diseaseName ?? undefined,
      disease_display: item.diseaseName ?? undefined,
      solution: item.TreatmentAdvice ?? undefined,
      confidence:
        typeof item.confidenceScore === "number" && Number.isFinite(item.confidenceScore)
          ? item.confidenceScore
          : undefined,
    };

    try {
      sessionStorage.setItem("latest_inference", JSON.stringify(inferred));
      if (typeof item.imagePath === "string" && item.imagePath.trim()) {
        sessionStorage.setItem("latest_image_url", item.imagePath);
      } else {
        sessionStorage.removeItem("latest_image_url");
      }
    } catch {
      // ignore storage failures (private mode / full quota)
    }

    router.push("/result");
  }

  useEffect(() => {
    if (!token) {
      window.location.href = "/";
      return;
    }

    const authToken = token;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotice(null);
      try {
        const data = await fetchHistory(authToken);
        if (cancelled) return;
        setItems(data);
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Gagal memuat riwayat.";
        setNotice({ type: "error", text: message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onDelete(id: string) {
    if (!token) {
      window.location.href = "/";
      return;
    }

    const ok = window.confirm("Yakin ingin menghapus riwayat ini?");
    if (!ok) return;

    setNotice(null);
    try {
      const result = await deleteHistoryItem(id, token);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setNotice({ type: "success", text: result.message || "Berhasil dihapus!" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menghapus riwayat.";
      setNotice({ type: "error", text: `Gagal menghapus: ${message}` });
    }
  }

  return (
    <>
      <Navbar />
      <div className="container">
        {loading ? (
          <p style={{ textAlign: "center" }}>Loading...</p>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-image">
              <Image src={emptyImage} alt="Plant illustration" width={320} height={240} />
            </div>
            <div className="empty-state-content">
              <h3>Belum ada riwayat identifikasi 🌱</h3>
              <p>Ayo perbanyak pohon dan cek kesehatan tanamanmu dengan PlantDoc.</p>
            </div>
          </div>
        ) : (
          <div className="history-container" id="history-list">
            {items.map((item) => {
              const imageBroken = Boolean(brokenImages[item.id]);
              const src = imageBroken ? "https://via.placeholder.com/260x180?text=No+Image" : item.imagePath;

              return (
                <div
                  className="history-card"
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openResultFromHistory(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openResultFromHistory(item);
                    }
                  }}
                >
                  <Image
                    src={src}
                    alt="Plant"
                    className="history-img"
                    width={520}
                    height={360}
                    unoptimized
                    onError={() => setBrokenImages((prev) => ({ ...prev, [item.id]: true }))}
                  />
                  <div className="history-info">
                    <p>
                      <strong>Penyakit:</strong> {item.diseaseName || "N/A"}
                    </p>
                    <p>
                      <strong>Solusi:</strong> {item.TreatmentAdvice || "-"}
                    </p>
                    <p>
                      <strong>Confidence:</strong> {formatConfidence(item.confidenceScore)}
                    </p>
                    <p>
                      <strong>Tanggal:</strong> {formatDateId(item.createdAt)}
                    </p>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {notice ? (
          <p
            className={notice.type === "error" ? "error" : "success"}
            role={notice.type === "error" ? "alert" : "status"}
            style={{ marginTop: 14 }}
          >
            {notice.text}
          </p>
        ) : null}
      </div>
    </>
  );
}
