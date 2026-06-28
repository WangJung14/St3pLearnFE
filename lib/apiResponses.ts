export interface ApiResponse<T> {
  data?: T;
  message?: string;
}

export interface PagePayload<T> {
  content?: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

export function unwrapData<T>(body: ApiResponse<T> | T): T {
  return (body as ApiResponse<T>).data ?? (body as T);
}

export function unwrapPageContent<T>(body: ApiResponse<PagePayload<T> | T[]> | PagePayload<T> | T[]): T[] {
  const payload = unwrapData<PagePayload<T> | T[]>(body);
  return Array.isArray(payload) ? payload : payload.content ?? [];
}
