export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchApi<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    let parsedMessage = errorBody;
    try {
      const errJson = JSON.parse(errorBody);
      parsedMessage = errJson.detail || errJson.message || errorBody;
    } catch {
      // Keep raw text if not valid JSON
    }
    throw new Error(parsedMessage || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}
