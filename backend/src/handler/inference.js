import 'dotenv/config';
import {
  getDiseaseDetailsWithFallback,
  getDiseaseSolutionWithFallback,
  normalizeDiseaseGroup,
} from '../utils/diseaseSolutions.js';

const DEFAULT_INFERENCE_URL =
  'https://swagenough--plantdoc-inference-api-plantdiseasemodel-predict.modal.run';

const isRecord = (value) => typeof value === 'object' && value !== null;

const formatCropName = (raw) => {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Example: 'Corn_(maize)' -> 'Corn (maize)'
  return trimmed.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
};

const toTitleCase = (value) => {
  if (typeof value !== 'string') return null;
  const clean = value
    .replace(/[_\-\/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return null;

  return clean
    .toLowerCase()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
};

const pickString = (obj, keys) => {
  if (!isRecord(obj)) return null;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
};

const pickNumber = (obj, keys) => {
  if (!isRecord(obj)) return null;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
};

const inferDiseaseLabel = (payload) => {
  const disease = pickString(payload, ['disease', 'diseaseName', 'disease_name']);
  if (disease) return normalizeDiseaseGroup(disease) || disease;

  const className = pickString(payload, ['class_name', 'label', 'class', 'predicted_class']);
  if (!className) return null;

  // Try to extract disease part from '<Crop>___<Disease>' style labels
  const parts = className.split('___').filter(Boolean);
  const tail = parts.length ? parts[parts.length - 1] : className;
  return normalizeDiseaseGroup(tail) || normalizeDiseaseGroup(className) || className;
};

const inferCropName = (payload) => {
  const className = pickString(payload, ['class_name', 'label', 'class', 'predicted_class']);
  if (!className) return null;
  if (!className.includes('___')) return null;

  const parts = className.split('___').filter(Boolean);
  if (parts.length < 2) return null;
  return formatCropName(parts[0]);
};

const inferConfidence = (payload) => {
  return pickNumber(payload, ['confidence', 'confidenceScore', 'score', 'probability']);
};

const enrichInferencePayload = (payload) => {
  if (!isRecord(payload)) {
    return {
      disease: 'Unknown',
      class_name: 'Unknown',
      confidence: 0,
      solution: getDiseaseSolutionWithFallback('Unknown'),
      raw: payload,
    };
  }

  const diseaseLabel = inferDiseaseLabel(payload);
  const confidence = inferConfidence(payload);
  const cropName = inferCropName(payload);

  const lowConfidenceThreshold = Number(process.env.LOW_CONFIDENCE_THRESHOLD || 0.7);
  const isHealthy = diseaseLabel === 'HEALTHY';
  const isLowConfidence = typeof confidence === 'number' && confidence < lowConfidenceThreshold;
  const isHealthyLowConfidence = Boolean(isHealthy && isLowConfidence);

  const diseaseGroup = diseaseLabel || 'Unknown';
  const diseaseDisplay = diseaseLabel ? toTitleCase(diseaseLabel) : 'Unknown';
  const details = getDiseaseDetailsWithFallback(diseaseLabel);

  const enriched = { ...payload };
  if (diseaseLabel && typeof enriched.disease !== 'string') enriched.disease = diseaseLabel;
  if (diseaseLabel && typeof enriched.class_name !== 'string') enriched.class_name = diseaseLabel;
  if (confidence !== null && typeof enriched.confidence !== 'number') enriched.confidence = confidence;

  // Additional normalized fields for app UI
  if (cropName && typeof enriched.crop_name !== 'string') enriched.crop_name = cropName;
  if (diseaseLabel && typeof enriched.disease_group !== 'string') enriched.disease_group = diseaseGroup;
  if (diseaseDisplay && typeof enriched.disease_display !== 'string') enriched.disease_display = diseaseDisplay;
  if (details && typeof enriched.treatment !== 'object') enriched.treatment = details.treatment;
  if (details && !Array.isArray(enriched.symptoms)) enriched.symptoms = details.symptoms;

  // Backward-compatible keys used by existing frontend normalizeInference()
  if (cropName && typeof enriched.plantName !== 'string') enriched.plantName = cropName;
  if (diseaseDisplay && typeof enriched.diseaseName !== 'string') enriched.diseaseName = diseaseDisplay;
  if (typeof confidence === 'number' && typeof enriched.confidenceScore !== 'number') {
    enriched.confidenceScore = confidence;
  }

  const existingSolution = typeof enriched.solution === 'string' ? enriched.solution.trim() : '';
  if (!existingSolution) enriched.solution = getDiseaseSolutionWithFallback(diseaseLabel);

  // Low confidence warning (especially important for HEALTHY)
  if (isHealthyLowConfidence) {
    enriched.warning = {
      type: 'low_confidence',
      message:
        `Kemungkinan: Sehat (Kurang Yakin). AI mendeteksi tanaman sehat, namun tingkat keyakinan rendah (${Math.round(confidence * 100)}%). ` +
        'Mohon pastikan foto fokus, pencahayaan cukup, dan tidak blur, atau cek gejala manual.',
      threshold: lowConfidenceThreshold,
    };
  }

  enriched.is_low_confidence = isLowConfidence;
  enriched.low_confidence_threshold = lowConfidenceThreshold;

  return enriched;
};

export const requestAiInference = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "File gambar tidak ditemukan!" });
    }

    const inferenceUrl = process.env.INFERENCE_URL || DEFAULT_INFERENCE_URL;
    const inferenceFieldName = process.env.INFERENCE_FIELD_NAME || 'image';
    const timeoutMs = Number(process.env.INFERENCE_TIMEOUT_MS || 30000);

    const form = new FormData();
    const blob = new Blob([file.buffer], {
      type: file.mimetype || 'application/octet-stream',
    });
    form.append(inferenceFieldName, blob, file.originalname || 'image');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let upstreamResponse;
    try {
      upstreamResponse = await fetch(inferenceUrl, {
        method: 'POST',
        body: form,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const contentType = upstreamResponse.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    const body = isJson
      ? await upstreamResponse.json().catch(() => null)
      : await upstreamResponse.text().catch(() => '');

    if (!upstreamResponse.ok) {
      return res.status(502).json({
        error: 'Inference request failed',
        upstream: {
          url: inferenceUrl,
          status: upstreamResponse.status,
          statusText: upstreamResponse.statusText,
          body,
        },
      });
    }

    if (isJson) {
      return res.status(200).json(enrichInferencePayload(body));
    }

    return res.status(200).send(body);
  } catch (err) {
    const isAbort = err?.name === 'AbortError';
    return res.status(502).json({
      error: isAbort ? 'Inference request timed out' : 'Inference request error',
      details: err?.message,
    });
  }
};
