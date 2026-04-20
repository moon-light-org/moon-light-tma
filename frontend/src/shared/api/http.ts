const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

type FetchOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  telegramInitData?: string | null;
};

export async function httpJson<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.telegramInitData) {
    headers["X-Telegram-Init-Data"] = options.telegramInitData;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) {
        message = data.error;
      }
    } catch {
      // no-op
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}
