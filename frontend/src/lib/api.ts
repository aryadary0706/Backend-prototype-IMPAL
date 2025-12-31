const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(data: unknown): string | null {
  if (!isRecord(data)) return null;
  const message = data.message;
  const error = data.error;
  if (typeof message === "string" && message.trim()) return message;
  if (typeof error === "string" && error.trim()) return error;
  return null;
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = isJson ? getErrorMessage(data) : null;
    if (message) throw new Error(message);

    const preview = typeof data === "string" ? data.slice(0, 200) : "";
    throw new Error(
      preview
        ? `API error (non-JSON response): ${preview}`
        : "API error"
    );
  }

  if (!isJson) {
    throw new Error("API error: expected JSON but received non-JSON response");
  }

  return data;
}

export async function apiFetchFormData(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    method: options.method ?? "POST",
    headers: {
      ...(options.headers || {}),
    },
    body: formData,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    const message = isJson ? getErrorMessage(data) : null;
    throw new Error(message || "API error");
  }

  if (!isJson) {
    throw new Error("API error: expected JSON but received non-JSON response");
  }

  return data;
}

export async function requestInference(image: File, token: string) {
  const formData = new FormData();
  formData.append("image", image);

  return apiFetchFormData("/inference", formData, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

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

function toHistoryItems(value: unknown): HistoryItem[] {
  if (!isRecord(value)) return [];
  const data = value.data;
  if (!Array.isArray(data)) return [];

  const items: HistoryItem[] = [];
  for (const raw of data) {
    if (!isRecord(raw)) continue;
    const id = raw.id;
    const imagePath = raw.imagePath;
    const createdAt = raw.createdAt;
    if (typeof id !== "string" || typeof imagePath !== "string" || typeof createdAt !== "string") continue;

    items.push({
      id,
      imagePath,
      createdAt,
      plantName: typeof raw.plantName === "string" ? raw.plantName : null,
      diseaseName: typeof raw.diseaseName === "string" ? raw.diseaseName : null,
      diseaseDescription: typeof raw.diseaseDescription === "string" ? raw.diseaseDescription : null,
      TreatmentAdvice: typeof raw.TreatmentAdvice === "string" ? raw.TreatmentAdvice : null,
      confidenceScore:
        typeof raw.confidenceScore === "number"
          ? raw.confidenceScore
          : typeof raw.confidenceScore === "string"
            ? Number(raw.confidenceScore)
            : null,
    });
  }

  return items;
}

export async function fetchHistory(token: string): Promise<HistoryItem[]> {
  const data = await apiFetch("/history", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return toHistoryItems(data);
}

export async function deleteHistoryItem(id: string, token: string): Promise<{ message?: string }>{
  const data = await apiFetch(`/history/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!isRecord(data)) return {};
  const message = typeof data.message === "string" ? data.message : undefined;
  return { message };
}

type DiseaseDetailsResponse = {
  diseaseGroup?: string;
  solution?: string;
  treatment?: {
    organic?: string[];
    chemical?: string[];
    cultural?: string[];
  };
  symptoms?: string[];
};

function toDiseaseDetails(value: unknown): DiseaseDetailsResponse {
  if (!isRecord(value)) return {};

  const diseaseGroup = typeof value.diseaseGroup === "string" ? value.diseaseGroup : undefined;
  const solution = typeof value.solution === "string" ? value.solution : undefined;

  const treatmentRaw = value.treatment;
  const treatment =
    typeof treatmentRaw === "object" && treatmentRaw !== null
      ? {
          organic: Array.isArray((treatmentRaw as Record<string, unknown>).organic)
            ? ((treatmentRaw as Record<string, unknown>).organic as unknown[]).filter((x): x is string => typeof x === "string")
            : undefined,
          chemical: Array.isArray((treatmentRaw as Record<string, unknown>).chemical)
            ? ((treatmentRaw as Record<string, unknown>).chemical as unknown[]).filter((x): x is string => typeof x === "string")
            : undefined,
          cultural: Array.isArray((treatmentRaw as Record<string, unknown>).cultural)
            ? ((treatmentRaw as Record<string, unknown>).cultural as unknown[]).filter((x): x is string => typeof x === "string")
            : undefined,
        }
      : undefined;

  const symptoms = Array.isArray(value.symptoms)
    ? (value.symptoms as unknown[]).filter((x): x is string => typeof x === "string")
    : undefined;

  return { diseaseGroup, solution, treatment, symptoms };
}

export async function fetchDiseaseDetails(disease: string, token: string): Promise<DiseaseDetailsResponse> {
  const data = await apiFetch(`/disease-details?disease=${encodeURIComponent(disease)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return toDiseaseDetails(data);
}
