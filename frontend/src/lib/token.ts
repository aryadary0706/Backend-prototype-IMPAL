export type TokenUser = {
  id?: string | number;
  userId?: string | number;
  name?: string;
  email?: string;
  [key: string]: unknown;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function removeToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
}

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  // atob handles binary strings; decode into UTF-8 safely.
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function getUserFromToken(tokenOverride?: string | null): TokenUser | null {
  const token = tokenOverride ?? getToken();
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payloadJson = decodeBase64Url(parts[1]);
    const payload = JSON.parse(payloadJson);
    return payload as TokenUser;
  } catch {
    return null;
  }
}
