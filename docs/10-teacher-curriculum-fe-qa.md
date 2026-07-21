# Hỏi đáp Frontend: Quản lý chương và bài học dành cho Teacher

Tài liệu này dùng để vấn đáp, thuyết trình hoặc bảo vệ phần Frontend của màn hình quản lý nội dung khóa học.

Phạm vi màn hình:

```text
/teacher/courses/{courseId}/curriculum
```

Code chính:

- [Trang quản lý chương trình học](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx)
- [Component upload nội dung và lưu YouTube](../components/courses/LessonContentUploader.tsx)
- [HTTP client có refresh token](../lib/apiFetch.ts)
- [Cấu hình API Gateway](../lib/apiConfig.ts)
- [Guard kiểm tra role](../components/guards/RoleGuard.tsx)
- [Auth hook](../context/AuthContext.tsx)
- [Toast feedback](../components/ui/Toast.tsx)
- [Danh sách dependency](../package.json)

---

## 1. Stack công nghệ

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Framework | Next.js 16.2.6 App Router | Routing, build và render ứng dụng React |
| UI runtime | React 19 | Component, state, event và `use()` |
| Ngôn ngữ | TypeScript 5.7 | Kiểm tra kiểu dữ liệu khi compile |
| Styling | Tailwind CSS 4 | Responsive layout và utility class |
| Server state | SWR 2.4 | Fetch, cache và revalidate dữ liệu API |
| Client auth state | Zustand qua `useAuth()` | Lưu token, user và trạng thái đăng nhập |
| HTTP | Native Fetch và `apiFetch` | Gọi API Gateway, xử lý JSON và refresh token |
| Upload | Cloudinary signed upload | Upload file trực tiếp, không truyền file qua backend |
| Icons | Lucide React | Icon cho nút và trạng thái |
| Feedback | Toast Context | Thông báo thành công, lỗi, cảnh báo |

Địa chỉ kiểm chứng stack: [`FE/package.json`](../package.json).

---

## 2. Luồng xử lý tổng thể

### 2.1. Luồng mở trang

```text
Teacher mở URL curriculum
        ↓
Next.js truyền params dưới dạng Promise
        ↓
React.use(params) lấy courseId
        ↓
RoleGuard kiểm tra đăng nhập và role TEACHER/ADMIN
        ↓
SWR tải thông tin khóa học
        ↓
SWR tải danh sách chương
        ↓
Promise.all tải lesson của từng chương
        ↓
Chuẩn hóa response → sắp xếp → render UI
```

### 2.2. Luồng mutation

```text
Người dùng nhập dữ liệu
        ↓
FE validate dữ liệu cơ bản
        ↓
Khóa nút hoặc đặt trạng thái processing
        ↓
POST/DELETE qua API Gateway
        ↓
Kiểm tra HTTP status và parse lỗi
        ↓
mutate() tải lại dữ liệu mới
        ↓
Toast thành công hoặc thất bại
```

### 2.3. Luồng upload Cloudinary

```text
Chọn file
  ↓
Kiểm tra token, loại file và dung lượng ≤ 500 MB
  ↓
GET upload signature từ Backend
  ↓
POST file trực tiếp lên Cloudinary
  ↓
Nhận secure_url, public_id và metadata
  ↓
POST URL nội dung về Backend
  ↓
mutate curriculum và cập nhật trạng thái bài học
```

---

## 3. Câu hỏi, trả lời và giải thích code

### Câu 1. Vì sao file page phải có `"use client"`?

**Trả lời:** Trang sử dụng `useState`, SWR, event click, `window.confirm`, router client và token trong browser. Đây đều là hành vi cần Client Component.

```tsx
"use client";

import { use, useState, type FormEvent } from "react";
```

Nếu bỏ directive này, Next.js sẽ xem page là Server Component và không cho sử dụng state hoặc browser API.

Địa chỉ code: [`app/teacher/courses/[courseId]/curriculum/page.tsx`](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L1).

---

### Câu 2. Tại sao `params` phải được unwrap bằng `use()`?

**Trả lời:** Trong Next.js 16, dynamic route params được truyền dưới dạng Promise. Truy cập trực tiếp `params.courseId` sẽ gây lỗi sync dynamic API.

```tsx
function CurriculumBuilderContent({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.courseId;
}
```

`use(params)` làm React chờ Promise hoàn tất và trả về object `{ courseId }`.

Địa chỉ code: [`curriculum/page.tsx`, phần resolve params](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L139).

---

### Câu 3. FE bảo vệ route Teacher như thế nào?

**Trả lời:** Nội dung page được bọc bởi `RoleGuard` và chỉ cho phép `TEACHER` hoặc `ADMIN`.

```tsx
export default function CurriculumBuilderPage({ params }: PageProps) {
  return (
    <RoleGuard allow={["TEACHER", "ADMIN"]}>
      <CurriculumBuilderContent params={params} />
    </RoleGuard>
  );
}
```

`RoleGuard` thực hiện ba bước:

1. Chờ auth store hydrate.
2. Nếu chưa đăng nhập thì redirect tới trang login theo role context.
3. Nếu sai role thì redirect về trang chủ phù hợp.

```tsx
const effectiveRole = getRoleFromToken(token) ?? normalizeRole(user?.role);
const hasRole = isAuthenticated && allow.includes(effectiveRole);

if (!isAuthenticated) {
  router.replace(`/${targetRole}/login`);
}

if (!hasRole) {
  router.replace(fallback ?? getRoleHomePath(effectiveRole));
}
```

FE guard chỉ phục vụ UX; backend vẫn phải kiểm tra role vì người dùng có thể gọi API ngoài giao diện.

Địa chỉ code:

- [`curriculum/page.tsx`, nơi dùng guard](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L612)
- [`components/guards/RoleGuard.tsx`](../components/guards/RoleGuard.tsx#L32)

---

### Câu 4. Token được lấy và sử dụng như thế nào?

**Trả lời:** Page lấy token qua `useAuth()`. `AuthContext` hiện là lớp tương thích mỏng, gọi Zustand store bên dưới.

```tsx
const { token } = useAuth();
```

```tsx
export function useAuth() {
  return useAuthStore();
}
```

Khi gọi API, token được chuyển thành header `Authorization: Bearer ...` thông qua `buildAuthHeaders` hoặc tự gắn vào request GET.

Địa chỉ code:

- [`context/AuthContext.tsx`](../context/AuthContext.tsx)
- [`curriculum/page.tsx`, nơi đọc token](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L149)

---

### Câu 5. Vì sao SWR key chứa cả endpoint và token?

**Trả lời:** SWR dùng key để nhận diện cache. Hai phiên đăng nhập không nên dùng chung cache dữ liệu riêng tư.

```tsx
const { data: courseSnapshot } = useSWR<CourseSnapshot>(
  token ? [`/api/courses/${courseId}`, token] : null,
  async ([path]) => {
    const body = await apiFetch(path);
    return unwrapData<CourseSnapshot>(body);
  }
);
```

Khi `token` chưa tồn tại, key là `null`, nên request chưa được chạy.

Địa chỉ code: [`curriculum/page.tsx`, course snapshot SWR](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L159).

---

### Câu 6. Luồng tải chương và bài học đang hoạt động ra sao?

**Trả lời:** FE gọi một request lấy chapters, sau đó dùng `Promise.all` để tải lessons của từng chapter song song.

```tsx
const chapters = await Promise.all(
  rawChapters.map(async (chapter) => {
    const lessonsRes = await fetch(
      `${API_BASE_URL}/api/courses/${courseId}/chapters/${chapter.id}/lessons`,
      { headers: { Authorization: `Bearer ${currentToken}` } }
    );

    if (!lessonsRes.ok) return normalizeChapter(chapter, []);

    const lessonsBody = await lessonsRes.json();
    const lessons = unwrapData<LessonResponse[]>(lessonsBody).map(normalizeLesson);
    return normalizeChapter(chapter, lessons);
  })
);
```

**Ưu điểm:** lessons của các chương được tải đồng thời thay vì tuần tự.

**Nhược điểm:** đây vẫn là mô hình N+1 request. Có 20 chương sẽ tạo 21 request. Tối ưu lâu dài là backend trả chapter và lesson trong một endpoint curriculum tổng hợp.

Địa chỉ code: [`curriculum/page.tsx`, curriculum SWR](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L166).

---

### Câu 7. Vì sao cần `normalizeLesson()` và `normalizeChapter()`?

**Trả lời:** Backend có thể trả `displayOrder` hoặc `orderIndex`, `durationSeconds` hoặc `duration`. Hai hàm normalize chuyển response mềm thành một shape thống nhất để UI không phải kiểm tra nhiều trường ở mọi nơi.

```tsx
function normalizeLesson(raw: LessonResponse): Lesson {
  return {
    id: raw.id,
    title: raw.title,
    lessonType: raw.lessonType ?? "VIDEO",
    duration: Math.max(
      1,
      Math.round(((raw.durationSeconds ?? raw.duration ?? 0) || 0) / 60)
    ),
    orderIndex: raw.displayOrder ?? raw.orderIndex ?? 1,
    isPreview: raw.isPreview ?? false,
    content: raw.content ?? null,
  };
}
```

Code này còn chuyển thời lượng từ giây sang phút để hiển thị.

Địa chỉ code: [`curriculum/page.tsx`, hàm normalize](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L89).

---

### Câu 8. State của form thêm lesson được tổ chức như thế nào?

**Trả lời:** Mỗi chapter có một form lesson riêng. State dùng `Record<chapterId, value>` để tránh việc nhập ở chương này làm thay đổi form của chương khác.

```tsx
const [newLessonTitle, setNewLessonTitle] =
  useState<Record<string, string>>({});
const [lessonDuration, setLessonDuration] =
  useState<Record<string, string>>({});
const [lessonType, setLessonType] =
  useState<Record<string, LessonType>>({});
```

Ví dụ cập nhật đúng chapter:

```tsx
setNewLessonTitle((current) => ({
  ...current,
  [chapter.id]: event.target.value,
}));
```

Địa chỉ code: [`curriculum/page.tsx`, khai báo state](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L153).

---

### Câu 9. Luồng thêm chương diễn ra như thế nào?

**Trả lời:** Handler ngăn submit mặc định, trim tên chương, kiểm tra token, khóa nút, gọi POST, reset input, revalidate và hiển thị toast.

```tsx
const handleAddChapter = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (!newChapterTitle.trim() || !token) return;

  setIsSavingChapter(true);
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/courses/${courseId}/chapters`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify({ title: newChapterTitle.trim() }),
      }
    );

    if (!res.ok) throw new Error("Không thêm được chương học");

    setNewChapterTitle("");
    await mutateCurriculum();
    toast.success("Đã thêm chương học mới");
  } finally {
    setIsSavingChapter(false);
  }
};
```

`finally` bảo đảm nút được mở lại dù request thành công hay thất bại.

Địa chỉ code: [`curriculum/page.tsx`, handleAddChapter](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L205).

---

### Câu 10. Vì sao duration được nhân với 60 khi thêm lesson?

**Trả lời:** UI cho Teacher nhập số phút, còn API lưu `durationSeconds`.

```tsx
body: JSON.stringify({
  title,
  lessonType: selectedLessonType,
  durationSeconds: Math.max(1, durationMinutes) * 60,
  isPreview: false,
});
```

`Math.max(1, durationMinutes)` bảo đảm thời lượng tối thiểu một phút. Backend vẫn cần validation vì request có thể bị chỉnh sửa ngoài FE.

Địa chỉ code: [`curriculum/page.tsx`, handleAddLesson](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L252).

---

### Câu 11. Vì sao thao tác xóa cần `window.confirm()`?

**Trả lời:** Xóa chương hoặc lesson là mutation có khả năng làm mất dữ liệu. Confirm giúp giảm thao tác nhầm.

```tsx
if (!window.confirm("Bạn có chắc chắn muốn xóa bài học này không?")) {
  return;
}
```

Sau DELETE thành công, FE gọi `mutateCurriculum()` để đồng bộ danh sách với backend.

Trong production có thể thay `window.confirm` bằng modal có thông tin rõ hơn: tên lesson, số nội dung liên quan và khả năng khôi phục.

Địa chỉ code:

- [`handleDeleteChapter`](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L233)
- [`handleDeleteLesson`](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L284)

---

### Câu 12. Tại sao sau mutation phải gọi `mutateCurriculum()`?

**Trả lời:** POST/DELETE thay đổi dữ liệu backend nhưng cache SWR vẫn chứa dữ liệu cũ. `mutateCurriculum()` yêu cầu SWR fetch lại key hiện tại và render dữ liệu mới.

```tsx
await mutateCurriculum();
toast.success("Đã thêm bài học mới");
```

Nếu bỏ `mutate()`, người dùng có thể phải refresh trình duyệt mới thấy kết quả.

Địa chỉ code: [`curriculum/page.tsx`](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx).

---

### Câu 13. FE phân biệt video, audio và PDF như thế nào?

**Trả lời:** `resolveContentType()` đọc MIME type của file và ánh xạ sang content type của hệ thống cùng resource type của Cloudinary.

```tsx
if (file.type.startsWith("video/")) {
  return { contentType: "VIDEO_CLOUDINARY", resourceType: "video" };
}

if (file.type.startsWith("audio/")) {
  return { contentType: "AUDIO_CLOUDINARY", resourceType: "video" };
}

if (file.type === "application/pdf") {
  return { contentType: "PDF_CLOUDINARY", resourceType: "raw" };
}
```

Cloudinary sử dụng resource type `video` cho cả video và audio; PDF được gửi qua `raw`.

Địa chỉ code: [`LessonContentUploader.tsx`, resolveContentType](../components/courses/LessonContentUploader.tsx#L43).

---

### Câu 14. FE validate file trước upload như thế nào?

**Trả lời:** Component kiểm tra:

1. Có file hay không.
2. Phiên đăng nhập còn token không.
3. Dung lượng không vượt 500 MB.
4. Có `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` không.
5. MIME type có được hỗ trợ không.

```tsx
const MAX_FILE_BYTES = 500 * 1024 * 1024;

if (file.size > MAX_FILE_BYTES) {
  setErrorMessage("File vượt quá giới hạn 500MB.");
  return;
}
```

Thuộc tính `accept` của input hỗ trợ UX, nhưng không thay thế validation trong code và backend.

Địa chỉ code:

- [`LessonContentUploader.tsx`, validation](../components/courses/LessonContentUploader.tsx#L107)
- [`LessonContentUploader.tsx`, file input](../components/courses/LessonContentUploader.tsx#L288)

---

### Câu 15. Tại sao upload phải xin signature từ backend?

**Trả lời:** FE không được chứa Cloudinary API secret. Backend dùng secret tạo chữ ký ngắn hạn; FE chỉ nhận `signature`, `timestamp`, `api_key` và `folder`.

```tsx
const signatureRes = await fetch(
  `${API_BASE_URL}/api/courses/${courseId}/chapters/${chapterId}/lessons/upload-signature`,
  { headers: buildAuthHeaders(token) }
);
```

Backend còn có thể kiểm tra Teacher có sở hữu course/chapter trước khi cấp signature.

Địa chỉ code: [`LessonContentUploader.tsx`, lấy signature](../components/courses/LessonContentUploader.tsx#L138).

---

### Câu 16. Vì sao file được upload trực tiếp lên Cloudinary?

**Trả lời:** Upload trực tiếp giảm tải bandwidth, RAM và thời gian xử lý cho backend.

```tsx
const uploadRes = await fetch(
  `https://api.cloudinary.com/v1_1/${cloudName}/${resolved.resourceType}/upload`,
  {
    method: "POST",
    body: form,
  }
);
```

Backend chỉ lưu URL và metadata sau khi Cloudinary trả kết quả.

Địa chỉ code: [`LessonContentUploader.tsx`, Cloudinary request](../components/courses/LessonContentUploader.tsx#L147).

---

### Câu 17. Sau khi Cloudinary trả URL, FE lưu gì vào backend?

**Trả lời:** FE gửi content type, `secure_url`, kích thước và metadata cần thiết.

```tsx
body: JSON.stringify({
  contentType: resolved.contentType,
  storageUrl: uploadBody.secure_url,
  fileSize: uploadBody.bytes ?? file.size,
  metadata: {
    publicId: uploadBody.public_id,
    resourceType: uploadBody.resource_type ?? resolved.resourceType,
    format: uploadBody.format,
    duration: uploadBody.duration,
    originalFilename: file.name,
  },
});
```

`publicId` cần thiết nếu sau này hệ thống muốn thay thế hoặc xóa tài nguyên trên Cloudinary.

Địa chỉ code: [`LessonContentUploader.tsx`, lưu lesson content](../components/courses/LessonContentUploader.tsx#L167).

---

### Câu 18. FE hỗ trợ những dạng URL YouTube nào?

**Trả lời:** Hàm parser hỗ trợ:

- Video ID 11 ký tự.
- `youtube.com/watch?v=...`.
- `youtu.be/...`.
- `/embed/...`.
- `/shorts/...`.
- `/live/...`.
- `youtube-nocookie.com`.

```tsx
if (hostname === "youtu.be") {
  candidate = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
} else if (
  hostname === "youtube.com" ||
  hostname === "youtube-nocookie.com"
) {
  candidate = parsed.searchParams.get("v");
}
```

Video ID cuối cùng phải khớp regex `[A-Za-z0-9_-]{11}`.

Địa chỉ code: [`LessonContentUploader.tsx`, extractYouTubeId](../components/courses/LessonContentUploader.tsx#L66).

---

### Câu 19. Link YouTube được chuẩn hóa trước khi lưu như thế nào?

**Trả lời:** FE chỉ lưu URL embed chuẩn cùng metadata video ID.

```tsx
body: JSON.stringify({
  contentType: "VIDEO_YOUTUBE",
  storageUrl: `https://www.youtube.com/embed/${videoId}`,
  fileSize: 0,
  metadata: {
    videoId,
    source: "youtube",
  },
});
```

Việc chuẩn hóa giúp player không phải xử lý nhiều dạng URL khác nhau.

Địa chỉ code: [`LessonContentUploader.tsx`, handleSaveYoutube](../components/courses/LessonContentUploader.tsx#L205).

---

### Câu 20. FE chống submit hai lần như thế nào?

**Trả lời:** State `isSavingChapter`, `isUploading` và `processingAction` được dùng để disable button trong lúc request đang chạy.

```tsx
<button disabled={!youtubeUrl || isUploading}>
  {isUploading ? <Loader2 className="animate-spin" /> : "Lưu Video"}
</button>
```

Đây là lớp bảo vệ UX. Backend vẫn nên có idempotency hoặc constraint để chống request trùng ở mức dữ liệu.

Địa chỉ code:

- [`curriculum/page.tsx`, trạng thái mutation](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L153)
- [`LessonContentUploader.tsx`, trạng thái upload](../components/courses/LessonContentUploader.tsx#L100)

---

### Câu 21. Loading, error và empty state được xử lý ra sao?

**Trả lời:** SWR cung cấp `isLoading` và `error`. UI render spinner khi tải, cảnh báo khi Course Service lỗi và nội dung hướng dẫn khi chưa có chapter.

```tsx
{isLoading && <Loader2 className="h-5 w-5 animate-spin" />}

{curriculumError && (
  <span>Không kết nối được Course Service</span>
)}

{!isLoading && chapters.length === 0 && (
  <div>Khóa học chưa có chương nào.</div>
)}
```

Địa chỉ code: [`curriculum/page.tsx`, trạng thái render](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L361).

---

### Câu 22. Toast được thiết kế như thế nào?

**Trả lời:** `ToastProvider` dùng Context để cung cấp bốn hàm `success`, `error`, `warning`, `info`. Mỗi toast tự đóng sau 4,5 giây và danh sách được giới hạn bốn thông báo.

```tsx
setMessages((current) => [message, ...current].slice(0, 4));
window.setTimeout(() => dismiss(id), 4500);
```

Toast container có `aria-live="polite"`, giúp công nghệ hỗ trợ đọc thông báo mà không ngắt nội dung hiện tại.

Địa chỉ code: [`components/ui/Toast.tsx`](../components/ui/Toast.tsx#L68).

---

### Câu 23. `apiFetch` xử lý access token hết hạn như thế nào?

**Trả lời:** Khi request trả 401:

1. Kiểm tra đã có request refresh nào chạy chưa.
2. Nếu chưa, gọi `/api/auth/refresh`.
3. Lưu access token mới.
4. Đánh thức các request đang chờ.
5. Retry request ban đầu.
6. Nếu refresh thất bại, xóa session và redirect login.

```tsx
if (!isRefreshing) {
  isRefreshing = true;
  const newToken = await tryRefreshToken();
  isRefreshing = false;

  pendingCallbacks.forEach((callback) => callback(newToken));
  pendingCallbacks = [];
} else {
  const newToken = await new Promise<string | null>((resolve) => {
    pendingCallbacks.push(resolve);
  });
}
```

Cơ chế hàng đợi tránh việc nhiều request đồng thời gặp 401 rồi cùng gọi refresh token.

Địa chỉ code: [`lib/apiFetch.ts`](../lib/apiFetch.ts#L31).

---

### Câu 24. Tại sao một số request dùng `apiFetch`, một số dùng `fetch` trực tiếp?

**Trả lời:** Code hiện tại vẫn đang trong quá trình chuẩn hóa. `apiFetch` tự thêm token và refresh khi 401; `fetch` trực tiếp cho phép kiểm soát URL/header chi tiết nhưng không tự refresh.

**Rủi ro hiện tại:** request curriculum hoặc upload dùng `fetch` trực tiếp có thể thất bại khi access token vừa hết hạn, trong khi request qua `apiFetch` có thể tự phục hồi.

**Hướng cải thiện:** mở rộng `apiFetch` để hỗ trợ absolute URL hoặc chuẩn hóa tất cả request nội bộ sang path tương đối.

Địa chỉ code:

- [`lib/apiFetch.ts`](../lib/apiFetch.ts)
- [`curriculum/page.tsx`, fetch trực tiếp](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L173)

---

### Câu 25. API base URL được cấu hình ở đâu?

**Trả lời:** Tất cả URL backend dùng `NEXT_PUBLIC_API_URL`; nếu biến môi trường không có thì fallback `http://localhost:8080`.

```ts
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
```

Ví dụ môi trường local:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

Địa chỉ code: [`lib/apiConfig.ts`](../lib/apiConfig.ts).

---

### Câu 26. Luồng duyệt và xuất bản khóa học được điều khiển thế nào?

**Trả lời:** FE đọc status khóa học và chỉ mở nút phù hợp:

```text
DRAFT hoặc REJECTED → Submit
PENDING_REVIEW      → Cancel submit
APPROVED            → Publish
PUBLISHED           → Đã xuất bản
```

Handler ánh xạ action sang endpoint:

```tsx
const endpoint =
  action === "submit"
    ? "submit"
    : action === "publish"
      ? "publish"
      : "cancel-submit";
```

Sau thành công, page revalidate cả snapshot hiện tại và cache `my-courses` để các màn hình khác cùng cập nhật.

Địa chỉ code: [`curriculum/page.tsx`, handleCourseAction](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L306).

---

### Câu 27. FE và BE chịu trách nhiệm validation gì?

**Trả lời:**

**Frontend:**

- Hiển thị validation sớm.
- Ngăn submit rỗng hoặc submit lặp.
- Kiểm tra MIME type, dung lượng và URL YouTube.
- Hiển thị lỗi dễ hiểu.

**Backend:**

- Xác thực token và role.
- Kiểm tra Teacher sở hữu course/chapter/lesson.
- Kiểm tra trạng thái course có cho phép sửa không.
- Kiểm tra payload, giới hạn dữ liệu và toàn vẹn quan hệ.
- Không tin `courseId`, file metadata hoặc duration do FE gửi.

Không thể xem validation FE là biện pháp bảo mật vì người dùng có thể bỏ qua giao diện và gọi API trực tiếp.

---

### Câu 28. Điểm cần cải thiện của upload hiện tại là gì?

**Trả lời:**

1. `fetch` không cung cấp callback upload progress thuận tiện, nên UI chỉ hiển thị spinner.
2. File tối đa 500 MB nhưng chưa có resumable upload.
3. Chưa có chức năng hủy upload.
4. Nếu Cloudinary upload thành công nhưng lưu backend thất bại, có thể sinh file mồ côi.
5. Chưa có retry riêng cho bước lưu metadata.

Giải pháp có thể dùng `XMLHttpRequest` để hiển thị phần trăm:

```tsx
function uploadWithProgress(
  url: string,
  body: FormData,
  onProgress: (percent: number) => void
) {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error("Upload thất bại"));
        return;
      }

      const response = JSON.parse(xhr.responseText) as { secure_url: string };
      resolve(response.secure_url);
    };

    xhr.onerror = () => reject(new Error("Mất kết nối khi upload"));
    xhr.send(body);
  });
}
```

Đây là code cải tiến minh họa, chưa phải implementation hiện tại.

---

### Câu 29. Màn hình responsive như thế nào?

**Trả lời:** Tailwind dùng mobile-first. Ví dụ form mặc định xếp dọc, từ breakpoint `sm` chuyển thành hàng ngang.

```tsx
className="mt-6 flex flex-col gap-2 sm:flex-row"
```

Khu vực workflow dùng một cột trên mobile và ba cột từ `md`:

```tsx
className="grid grid-cols-1 gap-4 md:grid-cols-3"
```

Địa chỉ code: [`curriculum/page.tsx`, phần render](../app/teacher/courses/%5BcourseId%5D/curriculum/page.tsx#L354).

---

### Câu 30. Cần test những trường hợp nào?

**Trả lời:**

#### Auth và quyền

- Chưa đăng nhập bị redirect.
- Student không thể truy cập route Teacher.
- Teacher chỉ sửa course thuộc quyền sở hữu.
- Access token hết hạn được refresh đúng với request qua `apiFetch`.

#### Chapter và lesson

- Thêm chapter hợp lệ.
- Không cho thêm tên chapter rỗng.
- Thêm lesson với từng loại nội dung.
- Duration được đổi đúng phút sang giây.
- Xóa chapter/lesson khi xác nhận và khi hủy confirm.
- UI revalidate sau mutation.

#### Upload

- MP4, WebM, MP3, WAV và PDF hợp lệ.
- File sai MIME type.
- File lớn hơn 500 MB.
- Thiếu Cloudinary cloud name.
- Backend không cấp signature.
- Cloudinary upload lỗi.
- Cloudinary thành công nhưng backend lưu URL lỗi.

#### YouTube

- `watch?v=`, `youtu.be`, `shorts`, `embed`, `live`.
- Video ID trực tiếp.
- Sai domain hoặc ID không đủ 11 ký tự.
- Disable nút trong lúc lưu.

#### UI

- Loading, error và empty state.
- Responsive mobile/tablet/desktop.
- Keyboard focus và thông báo toast.
- Không submit hai lần khi double click.

---

## 4. Câu hỏi phản biện nâng cao

### Câu 31. Vì sao không lưu toàn bộ chapters vào một `useState` rồi tự cập nhật?

**Trả lời:** Chapters là server state. SWR quản lý cache, revalidation và đồng bộ tốt hơn state thủ công. `useState` chỉ nên giữ dữ liệu UI tạm thời như input, tab và trạng thái processing.

### Câu 32. Có nên optimistic update không?

**Trả lời:** Có thể dùng cho thêm/xóa chapter để UI phản hồi nhanh hơn, nhưng cần rollback nếu API thất bại. Với mutation xóa dữ liệu hoặc upload lớn, cách revalidate sau server success đang an toàn và dễ kiểm soát hơn.

### Câu 33. Có nên cho phép kéo thả thứ tự không?

**Trả lời:** Có, nhưng cần cả FE drag-and-drop và endpoint backend lưu `displayOrder`. FE không nên chỉ đổi thứ tự trong local state vì refresh trang sẽ mất kết quả.

### Câu 34. Nếu hai tab cùng sửa curriculum thì sao?

**Trả lời:** Cách hiện tại dùng last-write-wins và SWR revalidation. Muốn tránh ghi đè, backend nên dùng version hoặc `updatedAt`, trả conflict 409 khi client gửi phiên bản cũ.

### Câu 35. Làm thế nào giảm N+1 request?

**Trả lời:** Backend cung cấp endpoint:

```text
GET /api/courses/{courseId}/curriculum
```

Response:

```json
{
  "data": [
    {
      "id": "chapter-id",
      "title": "Chapter 1",
      "lessons": []
    }
  ]
}
```

Khi đó FE chỉ cần một SWR request thay vì một request chapter cộng N request lesson.

---

## 5. Bài code thực hành và đáp án

### Đề bài

Viết handler lưu YouTube đáp ứng các yêu cầu:

1. Kiểm tra token.
2. Validate URL.
3. Không cho double submit.
4. Chuẩn hóa URL embed.
5. Hiển thị thành công hoặc lỗi.
6. Revalidate curriculum.

### Đáp án rút gọn

```tsx
const handleSaveYoutube = async () => {
  setMessage("");
  setErrorMessage("");

  if (!token) {
    setErrorMessage("Phiên đăng nhập đã hết hạn.");
    return;
  }

  const videoId = extractYouTubeId(youtubeUrl);
  if (!videoId) {
    setErrorMessage("Link YouTube không hợp lệ.");
    return;
  }

  setIsUploading(true);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/content`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify({
          contentType: "VIDEO_YOUTUBE",
          storageUrl: `https://www.youtube.com/embed/${videoId}`,
          fileSize: 0,
          metadata: { videoId, source: "youtube" },
        }),
      }
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message ?? "Không lưu được video");
    }

    setYoutubeUrl("");
    setMessage("Đã lưu video YouTube thành công.");
    await onUploaded();
  } catch (error) {
    setErrorMessage(
      error instanceof Error ? error.message : "Không lưu được video"
    );
  } finally {
    setIsUploading(false);
  }
};
```

Giải thích:

- Guard clause làm handler ngắn và dừng sớm khi dữ liệu sai.
- `videoId` được validate trước khi tạo embed URL.
- `isUploading` vừa hiển thị loading vừa chống submit lặp.
- `try/catch/finally` tách success, error và cleanup.
- `onUploaded()` gọi lại `mutateCurriculum()` từ component cha.

Code triển khai thực tế: [`components/courses/LessonContentUploader.tsx`](../components/courses/LessonContentUploader.tsx#L205).

---

## 6. Tóm tắt trả lời khi thuyết trình

> Màn hình curriculum được xây dựng bằng Next.js App Router, React 19 và TypeScript. Route được bảo vệ bởi RoleGuard cho Teacher/Admin. Dữ liệu chương và bài học được quản lý bằng SWR; mutation dùng native fetch rồi revalidate cache. Nội dung file được upload trực tiếp lên Cloudinary bằng signed upload, sau đó backend chỉ lưu URL và metadata. Link YouTube được parse, validate và chuẩn hóa thành embed URL. Giao diện có loading, error, empty state, toast và khóa nút khi đang xử lý. Hai điểm nên cải thiện tiếp là giảm N+1 request và thêm upload progress/resumable upload.
