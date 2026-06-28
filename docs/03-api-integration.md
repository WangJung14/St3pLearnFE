# 03 - API Integration

## 1. Base URL

```txt
http://localhost:8080
```

FE lấy từ biến môi trường Next.js:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Trong code:

```ts
// lib/apiConfig.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
```

## 2. Auth header

Các API cần login phải gửi:

```txt
Authorization: Bearer <Token>
```

Token lấy từ `useAuth()`:

```ts
const { token } = useAuth();
```

## 3. HTTP Client

Dự án dùng **native fetch** (không dùng Axios).

### 3.1 SWR Fetcher — dùng cho GET requests

```ts
// lib/fetcher.ts
interface FetchError extends Error {
  status?: number;
  info?: unknown;
}

export const fetcher = async (url: string): Promise<unknown> => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.") as FetchError;
    error.info = await res.json().catch(() => null);
    error.status = res.status;
    throw error;
  }

  return res.json();
};
```

### 3.2 Authenticated SWR fetch

```ts
import useSWR from "swr";
import { API_BASE_URL } from "@/lib/apiConfig";
import { useAuth } from "@/context/AuthContext";

// Trong component:
const { token } = useAuth();

const { data, error, isLoading } = useSWR(
  token ? `${API_BASE_URL}/api/courses/my-courses` : null,
  (url) =>
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json())
);
```

### 3.3 Mutation — POST / PUT / DELETE

Dùng native fetch trực tiếp trong event handler:

```ts
const handleCreate = async () => {
  setIsLoading(true);
  try {
    const res = await fetch(`${API_BASE_URL}/api/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(body?.message || "Request failed");
    }

    // Revalidate SWR cache
    await mutate(`${API_BASE_URL}/api/courses/my-courses`);

  } catch (err: unknown) {
    console.error(err);
  } finally {
    setIsLoading(false);
  }
};
```

## 4. Auth API

```ts
// POST /api/auth/login
const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const body = await res.json();
// body.data.accessToken

// POST /api/auth/register
const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, username, fullName }),
});

// POST /api/auth/logout
const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});
```

## 5. User API

```ts
// GET /api/users/me
const { data } = useSWR(
  token ? `${API_BASE_URL}/api/users/me` : null,
  (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
);

// POST /api/users/me (update profile)
await fetch(`${API_BASE_URL}/api/users/me`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(profileData),
});
```

## 6. Course API

```ts
// GET /api/courses/p/search
const queryParams = new URLSearchParams();
if (keyword) queryParams.append("keyword", keyword);
if (level !== "All") queryParams.append("level", level);
if (categoryId) queryParams.append("categoryId", categoryId);

const { data, isLoading, error } = useSWR(
  `${API_BASE_URL}/api/courses/p/search?${queryParams.toString()}`,
  fetcher,
  { revalidateOnFocus: false, shouldRetryOnError: false }
);

// GET /api/courses/p/{slug}
const { data } = useSWR(`${API_BASE_URL}/api/courses/p/${slug}`, fetcher);

// GET /api/courses/my-courses
const { data } = useSWR(
  token ? `${API_BASE_URL}/api/courses/my-courses` : null,
  (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
);

// POST /api/courses (tạo course)
const res = await fetch(`${API_BASE_URL}/api/courses`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ title, shortDescription, description, price, level, categoryId }),
});

// POST /api/courses/{courseId}/submit
await fetch(`${API_BASE_URL}/api/courses/${courseId}/submit`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});

// POST /api/courses/{courseId}/publish
await fetch(`${API_BASE_URL}/api/courses/${courseId}/publish`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});
```

## 7. Category & Tag API

```ts
// GET /api/categories
const { data } = useSWR(`${API_BASE_URL}/api/categories`, fetcher);
// response: body.data as Category[]

// GET /api/tags
const { data } = useSWR(`${API_BASE_URL}/api/tags`, fetcher);
```

## 8. Chapter & Lesson API

```ts
// GET /api/courses/{courseId}/chapters
const { data: chapters } = useSWR(
  token ? `${API_BASE_URL}/api/courses/${courseId}/chapters` : null,
  (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
);

// POST /api/courses/{courseId}/chapters
await fetch(`${API_BASE_URL}/api/courses/${courseId}/chapters`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ title, description }),
});

// GET /api/courses/{courseId}/chapters/{chapterId}/lessons
const { data: lessons } = useSWR(
  token ? `${API_BASE_URL}/api/courses/${courseId}/chapters/${chapterId}/lessons` : null,
  (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
);

// POST lesson
await fetch(`${API_BASE_URL}/api/courses/${courseId}/chapters/${chapterId}/lessons`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ title, type, isPreview }),
});

// DELETE lesson
await fetch(`${API_BASE_URL}/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${token}` },
});

// GET upload signature
const res = await fetch(
  `${API_BASE_URL}/api/courses/${courseId}/chapters/${chapterId}/lessons/upload-signature`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const { data: signature } = await res.json();
```

## 9. Review & Wishlist API

```ts
// GET /api/courses/p/{courseId}/reviews
const { data } = useSWR(`${API_BASE_URL}/api/courses/p/${courseId}/reviews`, fetcher);

// POST review
await fetch(`${API_BASE_URL}/api/courses/${courseId}/reviews`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ rating, reviewText }),
});

// POST update review
await fetch(`${API_BASE_URL}/api/courses/${courseId}/reviews/${reviewId}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ rating, reviewText }),
});

// DELETE review
await fetch(`${API_BASE_URL}/api/courses/${courseId}/reviews/${reviewId}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${token}` },
});

// GET /api/wishlists
const { data } = useSWR(
  token ? `${API_BASE_URL}/api/wishlists` : null,
  (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
);

// POST /api/wishlists/course/{courseId}
await fetch(`${API_BASE_URL}/api/wishlists/course/${courseId}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});

// DELETE /api/wishlists/courses/{courseId}
await fetch(`${API_BASE_URL}/api/wishlists/courses/${courseId}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${token}` },
});
```

## 10. Enrollment API

```ts
// POST /api/enrollments
await fetch(`${API_BASE_URL}/api/enrollments`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ courseId }),
});
```

## 11. Admin Approval API

```ts
// GET /api/courses/approvals/pending
const { data } = useSWR(
  token ? `${API_BASE_URL}/api/courses/approvals/pending` : null,
  (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
);

// GET /api/courses/approvals/{requestId}
const { data } = useSWR(
  token ? `${API_BASE_URL}/api/courses/approvals/${requestId}` : null,
  (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
);

// POST /api/courses/approvals/{requestId}/process
await fetch(`${API_BASE_URL}/api/courses/approvals/${requestId}/process`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    action: "APPROVE", // hoặc "REJECT"
    reviewNote: "Course content is valid.",
  }),
});
```

## 12. Offline Fallback

Nhiều trang có mock data fallback khi BE offline:

```ts
const { data: coursesResponse, error } = useSWR(url, fetcher, {
  shouldRetryOnError: false,
});

// Nếu lỗi thì dùng mock
const courses = error || !coursesResponse ? MOCK_COURSES : coursesResponse.content;
```

Chỉ dùng mock làm fallback. Không tạo page hoàn toàn bằng mock data khi API đã có endpoint thật.

## 13. Ghi chú

Các type response cần đồng bộ lại với Backend thật sau khi chạy API bằng Swagger/Postman.

Nếu tạo type tạm thì comment:

```ts
// TODO: Đồng bộ lại với response thật từ Backend.
```
