const envBaseUrl = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL;
const isLocalHost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const PROD_BACKEND_FALLBACK = "https://match3-backend-hjc0.onrender.com";

const API_BASE_URL = (envBaseUrl || (isLocalHost ? "http://127.0.0.1:8000" : PROD_BACKEND_FALLBACK)).replace(/\/$/, "");
const API_TIMEOUT_MS = Number(
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_TIMEOUT_MS ?? "30000"
);

export interface ApiResult<T> {
  data: T;
  ok: boolean;
}

export interface MatchUserPayload {
  name: string;
  interests: string[];
  goals: string[];
}

export interface MatchCurrentUserPayload {
  wallet?: string;
  name?: string;
}

export interface UserResponse {
  wallet?: string;
  name: string;
  interests: string[];
  goals: string[];
}

export interface MatchResponse {
  matches: Array<{
    name: string;
    score?: number;
    reason?: string;
  }>;
  current_user?: UserResponse;
  raw?: unknown;
}

export interface RefreshUsersResponse {
  success: boolean;
  message: string;
  count: number;
}

export interface GenerateIntroPayload {
  userA: UserResponse;
  userB: UserResponse;
}

export interface GenerateIntroResponse {
  message: string;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const abortController = new AbortController();
  const timeoutId = globalThis.setTimeout(() => abortController.abort(), API_TIMEOUT_MS);

  if (init?.signal) {
    if (init.signal.aborted) {
      abortController.abort();
    } else {
      init.signal.addEventListener("abort", () => abortController.abort(), { once: true });
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      },
      ...init,
      signal: abortController.signal
    });

    const rawText = await response.text();
    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    const isJsonResponse = contentType.includes("application/json");
    let payload: T | { detail?: string } | null = null;

    if (rawText) {
      if (isJsonResponse) {
        try {
          payload = JSON.parse(rawText) as T | { detail?: string };
        } catch {
          throw new Error(
            `Invalid JSON response from API (${response.status}). Ensure VITE_API_BASE_URL points to your backend URL.`
          );
        }
      } else {
        const preview = rawText.replace(/\s+/g, " ").slice(0, 120).trim();
        throw new Error(
          `Non-JSON response received (${response.status}). Check VITE_API_BASE_URL (${API_BASE_URL}). Response preview: ${preview}`
        );
      }
    }

    if (!response.ok) {
      const detail =
        typeof payload === "object" && payload !== null && "detail" in payload
          ? String((payload as { detail?: unknown }).detail ?? "")
          : "";
      throw new Error(detail || `API request failed (${response.status}).`);
    }

    return (payload ?? ({} as T)) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        `Request timed out after ${Math.round(API_TIMEOUT_MS / 1000)}s for ${path}. Backend may be down or cold-starting.`
      );
    }

    if (error instanceof TypeError) {
      throw new Error(`Failed to fetch ${path}. Ensure backend is running at ${API_BASE_URL} and CORS is enabled.`);
    }

    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error: backend is unreachable.");
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export async function getUsers(): Promise<UserResponse[]> {
  return apiRequest<UserResponse[]>("/users", { method: "GET" });
}

export async function refreshUsers(): Promise<RefreshUsersResponse> {
  return apiRequest<RefreshUsersResponse>("/refresh-users", { method: "POST" });
}

export async function matchUser(payload: MatchUserPayload): Promise<MatchResponse> {
  return apiRequest<MatchResponse>("/match-user", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function matchCurrentUser(payload: MatchCurrentUserPayload): Promise<MatchResponse> {
  return apiRequest<MatchResponse>("/match-current-user", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function generateIntro(payload: GenerateIntroPayload): Promise<GenerateIntroResponse> {
  return apiRequest<GenerateIntroResponse>("/generate-intro", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// Compatibility helper retained for existing imports.
export async function fetchRagMatches<T>(endpoint: string): Promise<ApiResult<T | null>> {
  try {
    const response = await fetch(endpoint);
    const data = (await response.json()) as T;
    return { data, ok: response.ok };
  } catch {
    return { data: null, ok: false };
  }
}
