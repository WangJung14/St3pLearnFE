# 04 - Auth and RBAC

## 1. Auth Module Hiện Tại

Auth logic nằm tập trung trong:

```txt
context/AuthContext.tsx
```

Helper liên quan role/guard:

```txt
lib/roleRoutes.ts
components/guards/AuthGuard.tsx
components/guards/GuestGuard.tsx
components/guards/RoleGuard.tsx
```

## 2. Auth Types

```ts
export type UserRole =
  | "STUDENT"
  | "TEACHER"
  | "ADMIN"
  | "MENTOR"
  | "MODERATOR";

interface User {
  id?: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  username?: string;
  role?: string;
}

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}
```

`setSimulatedRole` đã bị gỡ khỏi UI và AuthContext.

## 3. Token Storage

Dùng `localStorage`:

```txt
st3p_token
st3p_refresh_token
st3p_user
```

Khi restore session, FE đọc token trước, decode JWT để lấy role thật, rồi mới fallback sang `st3p_user.role`.

## 4. Role Helpers

```ts
ROLE_HOME_PATH = {
  STUDENT: "/dashboard/student",
  TEACHER: "/dashboard/teacher",
  ADMIN: "/dashboard/admin",
  MENTOR: "/dashboard/mentor",
  MODERATOR: "/dashboard/moderator",
};
```

Helper chính:

```ts
normalizeRole(role)
getRoleHomePath(role)
getRoleFromToken(token)
```

## 5. Login Flow

```txt
Login
  -> POST /api/auth/login
  -> nhận accessToken + refreshToken
  -> lưu token vào localStorage
  -> gọi GET /api/users/me để lấy user chính xác
  -> nếu /me lỗi thì fallback decode JWT
  -> lưu st3p_user
  -> redirect theo role:
     STUDENT   -> /dashboard/student
     TEACHER   -> /dashboard/teacher
     ADMIN     -> /dashboard/admin
     MENTOR    -> /dashboard/mentor
     MODERATOR -> /dashboard/moderator
```

Nếu URL login có `?redirect=...`, login page ưu tiên redirect đó. Nếu user không đủ role cho route đích, `RoleGuard` của route đích sẽ chuyển về dashboard đúng role.

## 6. Register Flow

```txt
Register
  -> POST /api/auth/register
  -> thành công: redirect /login
  -> thất bại: hiển thị lỗi form/toast
```

Register page bọc `GuestGuard`, nên user đã login không quay lại được form register.

## 7. Logout Flow

```txt
logout()
  -> setToken(null), setUser(null)
  -> xóa st3p_token, st3p_refresh_token, st3p_user
  -> clear toàn bộ SWR cache
  -> header/shell chuyển về /login sau click logout
```

## 8. Refresh Token

`lib/apiFetch.ts` tự xử lý:

```txt
request gặp 401
  -> POST /api/auth/refresh với st3p_refresh_token
  -> có access token mới: lưu st3p_token, retry request
  -> refresh fail: clear session và redirect /login
```

Lưu ý: các request gọi `fetch` trực tiếp không tự refresh. Với mutation/authenticated request mới nên ưu tiên `apiFetch` khi phù hợp.

## 9. Guards

### AuthGuard

```txt
chưa login -> /login
đã login  -> render children
```

### GuestGuard

```txt
chưa login -> render children
đã login  -> redirect dashboard đúng role
```

### RoleGuard

```txt
chưa login -> /login
sai role  -> dashboard đúng role của user hiện tại
đúng role -> render children
```

RoleGuard ưu tiên `getRoleFromToken(token)` rồi mới fallback sang `user.role`.

## 10. Route -> Role

| Route | Role yêu cầu |
|---|---|
| `/`, `/courses`, `/courses/:slug`, `/pricing`, `/chat`, `/forum`, `/forum/post/:postId` | Public |
| `/login`, `/register` | Guest only |
| `/dashboard` | Authenticated, redirect theo role |
| `/dashboard/student/**` | STUDENT hoặc ADMIN |
| `/dashboard/teacher/**` | TEACHER hoặc ADMIN |
| `/dashboard/admin/**` | ADMIN |
| `/dashboard/mentor/**` | MENTOR hoặc ADMIN |
| `/dashboard/moderator/**` | MODERATOR hoặc ADMIN |

## 11. Lưu Ý Bảo Mật

- FE guard chỉ để UX tốt hơn; Backend vẫn phải kiểm tra quyền thật.
- Không tin role từ localStorage nếu token có role khác.
- Không log token ra console.
- Không dùng lại UI giả lập role trong production.
