import type {
  AnalysisCaseRequest,
  AnalysisResponse,
  BackendHealthResponse,
  BackendHealthState,
} from "@/types/insafdost";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

function buildApiUrl(path: string): string {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const payload: unknown = await response.json();

      if (
        payload &&
        typeof payload === "object" &&
        "detail" in payload &&
        typeof (payload as { detail?: unknown }).detail === "string"
      ) {
        return (payload as { detail: string }).detail;
      }

      return JSON.stringify(payload);
    } catch {
      return `Request failed with status ${response.status}`;
    }
  }

  const text = await response.text();
  return text || `Request failed with status ${response.status}`;
}

export async function checkBackendHealth(
  signal?: AbortSignal,
): Promise<BackendHealthState> {
  try {
    const response = await fetch(buildApiUrl("/health"), {
      method: "GET",
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      return {
        connected: false,
        message: await readErrorMessage(response),
      };
    }

    const payload = (await response.json()) as BackendHealthResponse;

    return {
      connected: true,
      message: payload.message || "Backend ready",
    };
  } catch {
    return {
      connected: false,
      message: "Backend unavailable",
    };
  }
}

export async function analyzeCases(
  cases: string[],
): Promise<AnalysisResponse> {
  const requestBody: AnalysisCaseRequest = { cases };

  const response = await fetch(buildApiUrl("/analyze"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as AnalysisResponse;
}