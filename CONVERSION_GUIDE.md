# HTML to Next.js 16 Conversion Guide

## Tổng quan
File HTML từ team outsource đã được convert sang cấu trúc chuẩn Next.js 16 với Tailwind CSS v4. Dưới đây là chi tiết từng phần:

---

## 1️⃣ TAILWIND.CONFIG.TS

### File: `tailwind.config.ts`

**Các thay đổi:**
- ✅ Trích xuất toàn bộ object `tailwind.config` từ thẻ `<script>`
- ✅ Chuyển `darkMode: "class"` thành `darkMode: 'class'` (chuẩn TypeScript)
- ✅ Định nghĩa rõ ràng:
  - **colors**: 40+ màu theo Material Design System
  - **borderRadius**: DEFAULT, lg, xl, full
  - **spacing**: xs, sm, md, lg, xl, gutter, container-max, unit
  - **fontFamily**: 9 font family (tất cả dùng Inter)
  - **fontSize**: 9 typography presets với lineHeight, fontWeight, letterSpacing

### Cách sử dụng:
```tsx
// Thay vì class="font-body-md text-body-md"
<p className="font-body-md text-body-md text-secondary">
  Text content
</p>

// Spacing
<div className="px-lg py-xl gap-md">...</div>

// Colors - tất cả từ tailwind config
<div className="bg-primary text-on-primary">...</div>
```

---

## 2️⃣ APP/GLOBALS.CSS

### File: `app/globals.css`

**Các thay đổi:**
- ✅ Giữ lại Tailwind v4 imports và theme variables
- ✅ Thêm custom utilities từ HTML `<style>` vào `@layer utilities`:
  - `.shadow-soft`: box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05)
  - `.shadow-hover`: thêm transition và hover effect

### Custom Utilities:
```css
@layer utilities {
  .shadow-soft {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .shadow-hover {
    transition: box-shadow 0.3s ease;
  }

  .shadow-hover:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }
}
```

---

## 3️⃣ COMPONENTS (JSX/TSX)

### File Structure:
```
components/
├── header.tsx       # Navigation bar + Auth buttons
├── hero.tsx         # Hero section + Mockup
├── stats.tsx        # Statistics cards (dùng .map())
└── footer.tsx       # Footer links (dùng .map())

app/
├── page.tsx         # Main page (import all components)
├── layout.tsx       # Root layout
└── globals.css      # Global styles
```

---

## 🔄 MOCK DATA & API INTEGRATION READY

### 1. **Stats Component** (`components/stats.tsx`)
```tsx
interface Stat {
  value: string;
  label: string;
}

const statsData: Stat[] = [
  { value: '2.5M+', label: 'Total Students' },
  { value: '4,500+', label: 'Professional Courses' },
  // ...
];

// Render with .map()
statsData.map((stat, index) => (
  <div key={index}>
    <span>{stat.value}</span>
    <span>{stat.label}</span>
  </div>
))
```

**🎯 Để thay thế bằng API:**
```tsx
// Option 1: Fetch tại Server Component (RSC)
async function Stats() {
  const stats = await fetch('/api/stats');
  return (...)
}

// Option 2: Fetch tại Client Component (SWR)
import useSWR from 'swr';

export default function Stats() {
  const { data } = useSWR('/api/stats', fetcher);
  return statsData.map((stat) => ...)
}
```

---

### 2. **Footer Component** (`components/footer.tsx`)
```tsx
interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerSections: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Courses', href: '#' },
      // ...
    ],
  },
  // ...
];

// Render nested with .map()
footerSections.map((section) =>
  section.links.map((link) => ...)
)
```

**🎯 Để thay thế bằng API:**
```tsx
// Fetch footer config từ CMS hoặc database
const { data: footerSections } = useSWR('/api/footer-config', fetcher);
```

---

### 3. **Header Component** (`components/header.tsx`)
```tsx
const navLinks = [
  { label: 'Courses', href: '#' },
  { label: 'Categories', href: '#' },
  // ...
];

navLinks.map((link, index) => (
  <a key={index}>{link.label}</a>
))
```

**🎯 Để thay thế bằng API:**
```tsx
// Fetch nav links từ API
const { data: navLinks } = useSWR('/api/navigation', fetcher);
```

---

## 📝 KEY CONVERSIONS FROM HTML TO JSX

### 1. **Class → className**
```tsx
// ❌ HTML
<div class="px-lg py-xl">

// ✅ JSX
<div className="px-lg py-xl">
```

### 2. **Inline Style → React Object**
```tsx
// ❌ HTML
<div style="background-image: url('...')">

// ✅ JSX
<div style={{ backgroundImage: "url('...')" }}>
```

### 3. **Self-closing Tags**
```tsx
// ❌ HTML
<img src="..." >

// ✅ JSX
<img src="..." />
```

### 4. **Data Attributes → Props**
```tsx
// ❌ HTML
<div data-alt="...">

// ✅ JSX
<div title="...">
// hoặc lưu trong state/props
```

### 5. **Lặp lại Elements → .map()**
```tsx
// ❌ HTML (lặp lại cơ bản)
<div>2.5M+</div>
<div>4,500+</div>
<div>850k+</div>

// ✅ JSX
{statsData.map((stat) => (
  <div key={stat.id}>{stat.value}</div>
))}
```

---

## 🚀 NEXT STEPS - API INTEGRATION

### Step 1: Tạo API Routes
```tsx
// app/api/stats/route.ts
export async function GET() {
  return Response.json([
    { value: '2.5M+', label: 'Total Students' },
    // ...
  ]);
}
```

### Step 2: Fetch từ Components (SWR recommended)
```tsx
import useSWR from 'swr';

export default function Stats() {
  const { data, isLoading } = useSWR('/api/stats', fetcher);
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    statsData.map((stat) => (...))
  );
}
```

### Step 3: Database Integration (Optional)
```tsx
// Nếu cần database, setup Neon + Drizzle ORM
// app/api/stats/route.ts
import { db } from '@/db';

export async function GET() {
  const stats = await db.select().from(statsTable);
  return Response.json(stats);
}
```

---

## ✅ QUALITY CHECKLIST

- [x] Tailwind config với tất cả theme tokens
- [x] Global CSS với custom utilities
- [x] Components tách biệt (Header, Hero, Stats, Footer)
- [x] Mock data trong arrays (ready for API)
- [x] TypeScript interfaces cho data structures
- [x] Responsive design (md: breakpoints)
- [x] Proper JSX syntax (className, style objects)
- [x] Semantic HTML (header, main, footer)
- [x] Accessibility (font sizes, color contrast từ Material Design)

---

## 🎯 CUSTOMIZATION TIPS

### Thêm màu mới:
```ts
// tailwind.config.ts
colors: {
  'brand-new': '#ffffff',
}
```

### Thêm font family:
```ts
// tailwind.config.ts
fontFamily: {
  'new-font': ['Font Name', 'sans-serif'],
}
```

### Thêm component mới:
```tsx
// components/new-component.tsx
export default function NewComponent() {
  return <div>...</div>;
}

// Import tại app/page.tsx
import NewComponent from '@/components/new-component';
```

---

**Last Updated**: 2024
**Framework**: Next.js 16 + Tailwind CSS v4 + TypeScript
