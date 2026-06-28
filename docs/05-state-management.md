# 05 - State Management

## 1. Phân loại state

### Server state (dữ liệu từ API)

Dùng **SWR** (`swr` package):

- Course list, course detail
- Category, tag
- Chapter, lesson
- Review
- Wishlist
- Approval request
- Login history
- Enrollment
- My courses

### Client state (auth/session)

Dùng **React Context API** (`AuthContext`):

- `token` — access token
- `user` — thông tin user hiện tại (role, name, email...)
- `isAuthenticated`
- `isLoading`

### Local UI state

Dùng **React `useState`** trong từng component:

- Form field values
- Modal open/close
- Loading khi submit
- Search keyword, selected filter
- Accordion open/close

---

## 2. SWR — Data Fetching

### 2.1 Import

```ts
import useSWR from "swr";
import { mutate } from "swr";
import { API_BASE_URL } from "@/lib/apiConfig";
import { fetcher } from "@/lib/fetcher";
```

### 2.2 Key convention

Dùng URL string đầy đủ làm key:

```ts
// Public — không cần auth
`${API_BASE_URL}/api/courses/p/search?keyword=${keyword}`
`${API_BASE_URL}/api/courses/p/${slug}`
`${API_BASE_URL}/api/categories`

// Cần auth — null nếu chưa có token (SWR sẽ skip)
token ? `${API_BASE_URL}/api/courses/my-courses` : null
token ? `${API_BASE_URL}/api/courses/${courseId}/chapters` : null
```

### 2.3 Fetch không cần auth

```ts
const { data, error, isLoading } = useSWR(
  `${API_BASE_URL}/api/courses/p/search?${queryParams}`,
  fetcher,
  { revalidateOnFocus: false, shouldRetryOnError: false }
);
```

### 2.4 Fetch cần auth

```ts
const { token } = useAuth();

const { data, isLoading } = useSWR(
  token ? `${API_BASE_URL}/api/courses/my-courses` : null,
  (url) =>
    fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
);
```

### 2.5 Revalidate sau mutation

```ts
// Revalidate một key cụ thể
await mutate(`${API_BASE_URL}/api/courses/my-courses`);
await mutate(`${API_BASE_URL}/api/courses/${courseId}/chapters`);

// Revalidate tất cả (dùng sau login)
mutate(() => true, undefined, { revalidate: true });

// Clear tất cả (dùng sau logout)
mutate(() => true, undefined, { revalidate: false });
```

---

## 3. Bảng invalidate sau mutation

| Mutation | Revalidate key |
|---|---|
| Login / Register | `mutate(() => true, ...)` — revalidate all |
| Logout | `mutate(() => true, ...)` — clear all |
| Tạo course | `my-courses` |
| Sửa course | `my-courses` + `courses/p/${slug}` |
| Xóa course | `my-courses` |
| Thêm chapter | `courses/${courseId}/chapters` |
| Sửa/xóa lesson | `courses/${courseId}/chapters/${chapterId}/lessons` |
| Submit/publish course | `my-courses` |
| Approve/reject | `courses/approvals/pending` + `courses/approvals/${requestId}` |
| Thêm wishlist | `wishlists` |
| Xóa wishlist | `wishlists` |
| Thêm review | `courses/p/${courseId}/reviews` |
| Sửa/xóa review | `courses/p/${courseId}/reviews` |

---

## 4. AuthContext — Client State

```ts
// context/AuthContext.tsx
interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}
```

Persistence: **localStorage**

```ts
// Restore khi app load
useEffect(() => {
  const savedToken = localStorage.getItem("st3p_token");
  const savedUser = localStorage.getItem("st3p_user");
  // Role ưu tiên đọc từ JWT, rồi mới fallback sang savedUser.role.
  if (savedToken) setToken(savedToken);
  if (savedUser) setUser(parsedUserWithNormalizedRole);
  setIsLoading(false);
}, []);
```

---

## 5. Local UI State — dùng useState

Form field:

```ts
const [title, setTitle] = useState("");
const [price, setPrice] = useState("0");
const [isSaving, setIsSaving] = useState(false);
```

Modal / Accordion:

```ts
const [isOpen, setIsOpen] = useState(false);
const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
```

Filter state:

```ts
const [search, setSearch] = useState("");
const [selectedCategory, setSelectedCategory] = useState("All");
const [selectedLevel, setSelectedLevel] = useState("All");
const [sortField, setSortField] = useState("createdAt");
```

---

## 6. Không nên làm

- Không lưu server data (course list, chapter...) vào state thủ công — dùng SWR.
- Không dùng `useEffect` thủ công để fetch data nếu có thể dùng `useSWR`.
- Không dùng global state cho từng input form.
- Không copy data từ SWR cache vào `useState` trừ khi có lý do rõ ràng.
- Không gọi `fetch()` trong `useEffect` — đặt trong event handler hoặc SWR.
