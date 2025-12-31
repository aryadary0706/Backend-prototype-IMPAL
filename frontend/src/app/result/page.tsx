"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Navbar from "@/components/navbar";
import { getToken } from "@/lib/token";
import { fetchDiseaseDetails } from "@/lib/api";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStoredInference(value: unknown): StoredInference | null {
  if (!isRecord(value)) return null;

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

function renderList(items: string[] | undefined) {
  if (!items || items.length === 0) return <div style={{ fontSize: 14, lineHeight: 1.6 }}>-</div>;
  return (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
      {items.map((item, idx) => (
        <li key={`${idx}-${item.slice(0, 12)}`}>{item}</li>
      ))}
    </ul>
  );
}

function ResultCell({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `result-cell ${className}` : 'result-cell'}>
      <div className="result-cell__label">{label}</div>
      <div className="result-cell__value">{children}</div>
    </div>
  );
}

export default function ResultPage() {
  const token = useMemo(() => getToken(), []);

  useEffect(() => {
    if (!token) window.location.href = "/";
  }, [token]);

  const inference = useMemo<StoredInference | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("latest_inference");
    if (!raw) return null;

    try {
      const parsed: unknown = JSON.parse(raw);
      return toStoredInference(parsed);
    } catch {
      return null;
    }
  }, []);

  const [enrichedInference, setEnrichedInference] = useState<StoredInference | null>(null);

  useEffect(() => {
    setEnrichedInference(inference);
  }, [inference]);

  useEffect(() => {
    if (!token) return;
    if (!enrichedInference) return;

    const hasTreatment = Boolean(enrichedInference.treatment);
    const hasSymptoms = Array.isArray(enrichedInference.symptoms) && enrichedInference.symptoms.length > 0;

    if (hasTreatment && hasSymptoms) return;

    const diseaseKey =
      enrichedInference.disease_group ??
      enrichedInference.disease ??
      enrichedInference.diseaseName ??
      enrichedInference.disease_display ??
      enrichedInference.class_name;

    if (!diseaseKey || !diseaseKey.trim()) return;

    let cancelled = false;

    (async () => {
      try {
        const details = await fetchDiseaseDetails(diseaseKey, token);
        if (cancelled) return;

        setEnrichedInference((prev) => {
          if (!prev) return prev;

          const next: StoredInference = { ...prev };

          if (typeof details.diseaseGroup === "string" && details.diseaseGroup.trim()) {
            next.disease_group = details.diseaseGroup;
            if (typeof next.disease !== "string" || !next.disease.trim()) {
              next.disease = details.diseaseGroup;
            }
          }

          if (!next.treatment && details.treatment) next.treatment = details.treatment;
          if ((!next.symptoms || next.symptoms.length === 0) && details.symptoms) next.symptoms = details.symptoms;
          if ((!next.solution || !next.solution.trim()) && typeof details.solution === "string") {
            next.solution = details.solution;
          }

          return next;
        });
      } catch {
        // If fetching fails, keep rendering whatever we already have.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enrichedInference, token]);

  const imageUrl = useMemo<string | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("latest_image_url");
    return raw && raw.trim() ? raw : null;
  }, []);

  const data = enrichedInference;

  const confidence = data?.confidence;
  const isUnknown = confidence === undefined || confidence < 0.5;

  const isHealthyLowConfidence = Boolean(
    (data?.disease ?? data?.disease_group) === 'HEALTHY' &&
      typeof confidence === 'number' &&
      confidence < (typeof data?.low_confidence_threshold === 'number' ? data.low_confidence_threshold : 0.7)
  );

  const diseaseType = isUnknown
    ? "Unknown"
    : isHealthyLowConfidence
      ? "Healthy (Kurang Yakin)"
      : (data?.disease_display ?? data?.diseaseName ?? data?.disease ?? data?.class_name ?? "Unknown");

  const diseaseGroup = data?.disease ?? data?.disease_group;
  const isHealthy = diseaseGroup === 'HEALTHY' && !isUnknown;
  const isDisease = Boolean(diseaseGroup && diseaseGroup !== 'HEALTHY' && !isUnknown);

  const confidencePercent =
    typeof confidence === "number" ? `${(confidence * 100).toFixed(2)}%` : "-";

  const cropDetected =
    data?.crop_name ?? data?.plantName ?? (isUnknown ? null : null);

  const warningText =
    typeof data?.warning?.message === 'string' && data.warning.message.trim()
      ? data.warning.message
      : isHealthyLowConfidence
        ? `Kemungkinan: Sehat (Kurang Yakin). AI mendeteksi tanaman sehat, namun tingkat keyakinan rendah (${confidencePercent}). Mohon pastikan foto fokus, pencahayaan cukup, dan tidak blur, atau cek gejala manual.`
        : null;

  const treatment = data?.treatment;
  const symptoms = data?.symptoms ?? [];
  const [checkedSymptoms, setCheckedSymptoms] = useState<Record<number, boolean>>({});

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="upload-section">

          <div className="result-layout">
            <div className="result-image">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Preview"
                  width={360}
                  height={360}
                  unoptimized
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain',
                    borderRadius: 12,
                    background: '#ffffff',
                  }}
                />
              ) : (
                <div style={{ fontSize: 14, opacity: 0.8, alignSelf: "center" }}>
                  Preview tidak tersedia
                </div>
              )}
            </div>

            <div className="result-grid">
              <ResultCell label="Tanaman Terdeteksi">{cropDetected ?? '-'}</ResultCell>

              <ResultCell
                label="Disease Type"
                className={isHealthy ? 'result-cell--healthy' : isDisease ? 'result-cell--disease' : ''}
              >
                <span style={{ fontSize: 18, fontWeight: 800 }}>{diseaseType}</span>
              </ResultCell>

              <ResultCell label="Confidence">{confidencePercent}</ResultCell>

              <ResultCell label="Rekomendasi" className="result-cell--span result-cell--left">
                {isUnknown ? (
                  <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                    Confidence di bawah 0.5. Tolong ambil foto yang lebih jelas dan dekat.
                  </div>
                ) : warningText ? (
                  <div style={{ fontSize: 14, lineHeight: 1.6 }}>{warningText}</div>
                ) : (
                  <div style={{ fontSize: 14, lineHeight: 1.6 }}>{data?.solution ?? '-'}</div>
                )}
              </ResultCell>

              {!isUnknown ? (
                <>
                  <ResultCell label="Pengendalian Organik/Alami" className="result-cell--span result-cell--left">
                    {renderList(treatment?.organic)}
                  </ResultCell>

                  <ResultCell label="Pengendalian Kimiawi" className="result-cell--span result-cell--left">
                    {renderList(treatment?.chemical)}
                  </ResultCell>

                  <ResultCell label="Kultur Teknis" className="result-cell--span result-cell--left">
                    {renderList(treatment?.cultural)}
                  </ResultCell>

                  <ResultCell label="Checklist Gejala (Verifikasi)" className="result-cell--span result-cell--left">
                    {symptoms.length === 0 ? (
                      <div style={{ fontSize: 14, lineHeight: 1.6 }}>-</div>
                    ) : (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {symptoms.map((s, idx) => (
                          <label
                            key={`${idx}-${s.slice(0, 12)}`}
                            style={{
                              display: 'flex',
                              gap: 10,
                              alignItems: 'flex-start',
                              fontSize: 14,
                              lineHeight: 1.4,
                              fontWeight: 500,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(checkedSymptoms[idx])}
                              onChange={(e) =>
                                setCheckedSymptoms((prev) => ({ ...prev, [idx]: e.target.checked }))
                              }
                              style={{ marginTop: 3 }}
                            />
                            <span>{s}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </ResultCell>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
