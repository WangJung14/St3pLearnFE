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

let isRefreshing = false;
let pendingCallbacks: Array<(token: string | null) => void> = [];

/** Lấy token hiện tại từ localStorage */
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("st3p_token");
}

/** Xóa session và redirect về /login (hard redirect để reset toàn bộ React tree) */
function clearSessionAndRedirect(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("st3p_token");
  localStorage.removeItem("st3p_user");
  localStorage.removeItem("st3p_refresh_token");
  window.location.href = "/login";
}

/**
 * Thử refresh access token dùng refresh token trong localStorage.
 * @returns token mới hoặc null nếu thất bại
 */
async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const refreshToken = localStorage.getItem("st3p_refresh_token");
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
      localStorage.setItem("st3p_token", newToken);
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
  init: RequestInit = {}
): Promise<T> {
  const buildHeaders = (token: string | null): Record<string, string> => ({
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

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
      const body = await res.json().catch(() => null);
      throw new Error(
        (body as { message?: string })?.message ?? `HTTP ${res.status}`
      );
    }
    return res.json() as Promise<T>;
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
    const body = await res.json().catch(() => null);
    throw new Error(
      (body as { message?: string })?.message ?? `HTTP ${res.status}`
    );
  }

  return res.json() as Promise<T>;
}
