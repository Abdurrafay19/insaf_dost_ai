import type { AnalyzeStreamRequest, StreamEvent } from "@/types/insafdost";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const FRIENDLY_STATUS_MESSAGES: Record<number, string> = {
  422: "The request was rejected. Each matter must be 1 to 15,000 characters, and you can send at most 5 matters.",
  429: "The service is busy. Wait a minute and try again.",
  503: "The analysis engine is still starting up. Wait about a minute and try again.",
};

function buildApiUrl(path: string): string {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

function parseEventChunk(chunk: string): StreamEvent | null {
  const lines = chunk
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 &&
        !line.startsWith(":") &&
        !line.startsWith("event:") &&
        !line.startsWith("id:"),
    )
    .map((line) => (line.startsWith("data:") ? line.slice(5).trim() : line));

  const payload = lines.join("\n");

  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload) as StreamEvent;
  } catch {
    return null;
  }
}

export async function streamAnalysis(
  cases: string[],
  onEvent: (event: StreamEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const requestBody: AnalyzeStreamRequest = { cases };

  const response = await fetch(buildApiUrl("/analyze/stream"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!response.ok || !response.body) {
    let detail = `Request failed with status ${response.status}`;

    const friendly = FRIENDLY_STATUS_MESSAGES[response.status];

    if (friendly) {
      detail = friendly;
    } else {
      try {
        const errorPayload: unknown = await response.json();

        if (
          errorPayload &&
          typeof errorPayload === "object" &&
          "detail" in errorPayload &&
          typeof (errorPayload as { detail?: unknown }).detail === "string"
        ) {
          detail = (errorPayload as { detail: string }).detail;
        }
      } catch {
        // Non-JSON error body; fall back to the default message.
      }
    }

    throw new Error(detail);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    buffer = buffer.replace(/\r\n/g, "\n");

    let boundary = buffer.indexOf("\n\n");

    while (boundary !== -1) {
      const rawChunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      const event = parseEventChunk(rawChunk);
      if (event) {
        onEvent(event);
      }

      boundary = buffer.indexOf("\n\n");
    }
  }

  const finalEvent = parseEventChunk(buffer);
  if (finalEvent) {
    onEvent(finalEvent);
  }
}
