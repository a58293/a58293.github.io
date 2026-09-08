export type VerificationResultCode =
  | "valid_first"
  | "valid_repeat"
  | "not_found"
  | "blocked"
  | "void"
  | "rate_limited"
  | "invalid_input"
  | "service_unavailable"
  | "forbidden";

export interface VerificationResponse {
  ok: boolean;
  result: VerificationResultCode;
  message: string;
  requestId?: string;
  product?: {
    name?: string;
    seriesName?: string;
    batchCode?: string;
    serialNumber?: string;
    publicDetails?: Record<string, unknown>;
  };
  verification?: {
    count: number;
    firstVerifiedAt?: string;
    lastVerifiedAt?: string;
  };
}

function configuredEndpoint() {
  const value = String(import.meta.env.VITE_VERIFICATION_API_URL || "").trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    const localDevelopment = import.meta.env.DEV && ["127.0.0.1", "localhost"].includes(url.hostname);
    return url.protocol === "https:" || (localDevelopment && url.protocol === "http:") ? url.href : "";
  } catch {
    return "";
  }
}

export const verificationApiUrl = configuredEndpoint();

export async function verifyAuthenticity(certificate: string, order: string, signal: AbortSignal) {
  if (!verificationApiUrl) throw new Error("NOT_CONFIGURED");
  const response = await fetch(verificationApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ certificate, order }),
    cache: "no-store",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    signal,
  });
  const data = await response.json().catch(() => null) as VerificationResponse | null;
  if (!data || typeof data.result !== "string") throw new Error("INVALID_RESPONSE");
  return data;
}
