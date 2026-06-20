# 🎯 HTML to Next.js 16 Conversion - EduMastery

## 📋 Summary

Tệp HTML từ team outsource đã được chuyển đổi thành cấu trúc Next.js 16 chuẩn với TypeScript, Tailwind CSS v4 và component architecture.

---

## 📁 File Structure Created

```
┌─ tailwind.config.ts          ← 1️⃣ Tailwind Configuration
├─ app/globals.css             ← 2️⃣ Global Styles + Custom Utilities
├─ app/page.tsx                ← Main Page (imports all components)
├─ components/
│  ├─ header.tsx               ← Navigation + Auth buttons
│  ├─ hero.tsx                 ← Hero section + Dashboard mockup
│  ├─ stats.tsx                ← Stats cards (with mock data array)
│  └─ footer.tsx               ← Footer (with mock data array)
├─ CONVERSION_GUIDE.md         ← Detailed conversion guide
└─ HTML_CONVERSION_README.md   ← This file
```

---

## ✨ Key Improvements

### 1️⃣ **Tailwind Configuration** (`tailwind.config.ts`)
- ✅ Extracted all theme tokens from HTML script
- ✅ Defined 40+ Material Design colors
- ✅ Custom spacing scale (xs, sm, md, lg, xl, etc.)
- ✅ Typography presets (9 font sizes with line height, weight)
- ✅ Border radius system

**Usage:**
```tsx
<p className="font-body-md text-body-md text-secondary">Text</p>
<div className="px-lg py-xl rounded-xl">Container</div>
```

---

### 2️⃣ **Global Styles** (`app/globals.css`)
- ✅ Tailwind v4 base imports
- ✅ Custom utility classes (.shadow-soft, .shadow-hover)
- ✅ Inter font family applied globally

**Custom Utilities:**
```css
.shadow-soft { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
.shadow-hover { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); }
```

---

### 3️⃣ **Component Architecture**

#### **Header Component** (`components/header.tsx`)
```tsx
- Logo + Navigation links (nav-links array)
- Auth buttons (Login, Register)
- Responsive: hidden on mobile, flex on md+
```

#### **Hero Component** (`components/hero.tsx`)
```tsx
- H1 headline + description
- 2 CTA buttons (Explore, Become Instructor)
- Background image mockup (hidden on mobile, visible on md+)
```

#### **Stats Component** (`components/stats.tsx`)
```tsx
interface Stat {
  value: string;    // "2.5M+"
  label: string;    // "Total Students"
}

statsData: Stat[] = [...]

// Rendered with .map() → Easy to replace with API data
```

#### **Footer Component** (`components/footer.tsx`)
```tsx
interface FooterLink { label, href }
interface FooterSection { title, links[] }

footerSections: FooterSection[] = [...]

// Rendered with nested .map() → Ready for CMS/API
```

---

## 🔄 Mock Data Structure (API Ready)

### Stats Card Example
```tsx
// Current: Mock data array
const statsData: Stat[] = [
  { value: '2.5M+', label: 'Total Students' },
  { value: '4,500+', label: 'Professional Courses' },
  { value: '850k+', label: 'Certified Graduates' },
  { value: '1,200+', label: 'Industry Instructors' },
];

// To replace with API:
const { data: statsData } = useSWR('/api/stats', fetcher);
```

### Footer Links Example
```tsx
// Current: Mock nested array
const footerSections: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Courses', href: '/courses' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  // ...
];

// To replace with API:
const { data: footerSections } = useSWR('/api/footer-config', fetcher);
```

---

## 🚀 Quick API Integration Guide

### Step 1: Create API Route
```tsx
// app/api/stats/route.ts
export async function GET() {
  return Response.json([
    { value: '2.5M+', label: 'Total Students' },
    // ...
  ]);
}
```

### Step 2: Use SWR in Component
```tsx
// components/stats.tsx
import useSWR from 'swr';

export default function Stats() {
  const { data, isLoading } = useSWR('/api/stats', fetcher);
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {data?.map((stat) => (
        <div key={stat.label}>
          <span>{stat.value}</span>
          <span>{stat.label}</span>
        </div>
      ))}
    </section>
  );
}
```

---

## 🎯 HTML to JSX Conversion Mapping

| HTML | JSX | Example |
|------|-----|---------|
| `class=""` | `className=""` | `className="px-lg py-xl"` |
| `style="..."` | `style={{}}` | `style={{ backgroundImage: "url(...)" }}` |
| `<img>` | `<img />` | Self-closing tag |
| Repeated HTML | `.map()` | `statsData.map((stat) => ...)` |
| `data-*` | Props/state | `title="..."` or store in state |

---

## 📝 Design System Reference

### Colors (40+ tokens)
```
Primary: #0b6b1d
Secondary: #545f73
Surface: #f8f9ff
Surface Container: #e5eeff
Error: #ba1a1a
Tertiary: #9d365f
```

### Typography
- **Display Large**: 48px, 700, -0.02em letter-spacing
- **Headline Large**: 32px, 700, -0.01em letter-spacing
- **Body Large**: 18px, 400, normal
- **Label Medium**: 14px, 600, 0.01em letter-spacing

### Spacing
```
xs: 4px
sm: 8px
md: 16px
lg: 24px (padding, margin)
xl: 32px
```

---

## ✅ Quality Checklist

- [x] Tailwind config with full theme
- [x] Global CSS with utilities
- [x] 4 components (Header, Hero, Stats, Footer)
- [x] TypeScript interfaces for data
- [x] Mock data arrays ready for API
- [x] Responsive design (md: breakpoints)
- [x] Proper JSX syntax (className, style objects)
- [x] Semantic HTML tags (header, main, footer)
- [x] Material Design color system
- [x] Working dev server

---

## 🔧 Development

### Start Dev Server
```bash
pnpm dev
# Open http://localhost:3000
```

### Build for Production
```bash
pnpm build
pnpm start
```

---

## 📚 Additional Resources

- **Full Conversion Guide**: See `CONVERSION_GUIDE.md`
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS v4**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

## 🎓 Next Steps

1. **Test locally**: `pnpm dev` → `http://localhost:3000`
2. **Add database**: Setup Neon/Supabase if needed
3. **Create API routes**: `/api/stats`, `/api/footer-config`, etc.
4. **Replace mock data**: Use SWR to fetch from APIs
5. **Deploy**: Push to GitHub → Deploy to Vercel

---

**Converted**: 2024 | **Framework**: Next.js 16 + Tailwind CSS v4 + TypeScript
