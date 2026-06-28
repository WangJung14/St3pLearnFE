export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function buildAuthHeaders(
  token: string,
  fallbackRole = "TEACHER"
): Record<string, string> {
  const payload = decodeJwtPayload(token);
  const subject = payload?.sub;
  const role = payload?.role;

  return {
    Authorization: `Bearer ${token}`,
    "X-User-Id": typeof subject === "string" ? subject : "",
    "X-User-Role": typeof role === "string" ? role : fallbackRole,
  };
}
