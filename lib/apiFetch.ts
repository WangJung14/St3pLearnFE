/**
 * apiFetch — Authenticated fetch helper với tự động refresh token khi gặp 401.
 *
 * Dùng cho mọi API call cần Authorization thay vì gọi fetch() trực tiếp.
 *
 * Cách dùng:
 * ```ts
 * import { apiFetch } from "@/lib/apiFetch";
 *
 * // GET
 * const data = await apiFetch<CourseListResponse>("/api/courses/my-courses");
 *
 * // POST
 * const result = await apiFetch<CourseResponse>("/api/courses", {
 *   method: "POST",
 *   body: JSON.stringify(payload),
 * });
 * ```
 */

import { API_BASE_URL } from "./apiConfig";
import { getRoleStorageKey, getActiveRoleContext } from "./activeRoleHelper";
import { buildAuthHeaders } from "./authHeaders";

export type ApiResponseType = "json" | "blob" | "text";

export interface ApiFetchOptions {
  responseType?: ApiResponseType;
}

let isRefreshing = false;
let pendingCallbacks: Array<(token: string | null) => void> = [];

/** Lấy token hiện tại từ localStorage */
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const tokenKey = getRoleStorageKey("st3p_token");
  return localStorage.getItem(tokenKey);
}

/** Xóa session và redirect về /login (hard redirect để reset toàn bộ React tree) */
function clearSessionAndRedirect(): void {
  if (typeof window === "undefined") return;
  const tokenKey = getRoleStorageKey("st3p_token");
  const userKey = getRoleStorageKey("st3p_user");
  const refreshKey = getRoleStorageKey("st3p_refresh_token");

  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  localStorage.removeItem(refreshKey);
  
  const targetRole = getActiveRoleContext().toLowerCase();
  window.location.href = `/${targetRole}/login`;
}

/**
 * Thử refresh access token dùng refresh token trong localStorage.
 * @returns token mới hoặc null nếu thất bại
 */
async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const refreshKey = getRoleStorageKey("st3p_refresh_token");
  const refreshToken = localStorage.getItem(refreshKey);
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const body = await res.json().catch(() => null);
    // Hỗ trợ cả hai shape: body.data.accessToken và body.accessToken
    const newToken =
      body?.data?.accessToken ?? body?.accessToken ?? null;

    if (newToken) {
      const tokenKey = getRoleStorageKey("st3p_token");
      localStorage.setItem(tokenKey, newToken);
    }

    return newToken;
  } catch {
    return null;
  }
}

/**
 * Gọi API với Bearer token tự động từ localStorage.
 * Tự động retry sau khi refresh nếu gặp 401.
 * Redirect /login nếu refresh thất bại.
 *
 * @param path   URL path bắt đầu bằng "/" (không bao gồm base URL)
 * @param init   RequestInit options (method, body, headers...)
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {}
): Promise<T> {
  const responseType = options.responseType ?? "json";
  const buildHeaders = (token: string | null): Headers => {
    const headers = new Headers(init.headers);
    const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

    if (init.body && !isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      Object.entries(buildAuthHeaders(token)).forEach(([key, value]) => {
        if (value && !headers.has(key)) headers.set(key, value);
      });
    }

    return headers;
  };

  const parseResponse = async (res: Response): Promise<T> => {
    if (res.status === 204) return undefined as T;
    if (responseType === "blob") return await res.blob() as T;
    if (responseType === "text") return await res.text() as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  };

  const parseError = async (res: Response): Promise<string> => {
    const text = await res.text().catch(() => "");
    if (!text) return `HTTP ${res.status}`;
    try {
      const body = JSON.parse(text) as { message?: string };
      return body.message ?? `HTTP ${res.status}`;
    } catch {
      return text;
    }
  };

  const doFetch = (token: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: buildHeaders(token),
    });

  // --- Request lần 1 ---
  let res = await doFetch(getStoredToken());

  // Không gặp 401 → xử lý bình thường
  if (res.status !== 401) {
    if (!res.ok) {
      throw new Error(await parseError(res));
    }
    return parseResponse(res);
  }

  // --- 401: thử refresh token ---
  if (!isRefreshing) {
    isRefreshing = true;

    const newToken = await tryRefreshToken();
    isRefreshing = false;

    // Notify tất cả request đang chờ
    pendingCallbacks.forEach((cb) => cb(newToken));
    pendingCallbacks = [];

    if (!newToken) {
      clearSessionAndRedirect();
      throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
    }

    res = await doFetch(newToken);
  } else {
    // Chờ request refresh đang chạy hoàn thành
    const newToken = await new Promise<string | null>((resolve) => {
      pendingCallbacks.push(resolve);
    });

    if (!newToken) {
      throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
    }

    res = await doFetch(newToken);
  }

  // --- Retry sau refresh ---
  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return parseResponse(res);
}
