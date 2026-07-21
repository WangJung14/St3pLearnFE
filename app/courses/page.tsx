"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { BookOpen, Loader2, RefreshCw, Search } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CourseCard, { type Course } from "@/components/courses/CourseCard";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { unwrapData, unwrapPageContent, type ApiResponse, type PagePayload } from "@/lib/apiResponses";
import { useAuth } from "@/context/AuthContext";

interface Category { id: string; name: string; slug?: string }

const levels = ["ALL", "A1", "A2", "B1", "B2", "C1", "C2", "IELTS", "TOEIC", "TOEFL"];

export default function CoursesPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [level, setLevel] = useState("ALL");
  const [categoryId, setCategoryId] = useState("ALL");
  const [sort, setSort] = useState("createdAt-DESC");

  useEffect(() => {
    const timer = window.setTimeout(() => setKeyword(search.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const path = useMemo(() => {
    const query = new URLSearchParams({ page: "0", size: "30" });
    if (keyword) query.set("keyword", keyword);
    if (level !== "ALL") query.set("level", level);
    if (categoryId !== "ALL") query.set("categoryId", categoryId);
    const [sortBy, sortDir] = sort.split("-");
    query.set("sortBy", sortBy);
    query.set("sortDir", sortDir);
    return `${API_BASE_URL}/api/courses/p/search?${query}`;
  }, [categoryId, keyword, level, sort]);

  const { data: categories = [], error: categoriesError, isLoading: categoriesLoading } = useSWR<Category[]>(
    [`${API_BASE_URL}/api/categories`, token ?? "PUBLIC"],
    async ([url, currentToken]: readonly [string, string]) => {
      const response = await fetch(url, {
        headers: currentToken === "PUBLIC" ? undefined : buildAuthHeaders(currentToken),
      });
      const body = await response.json().catch(() => null) as ApiResponse<Category[]> | Category[] | null;
      if (!response.ok) throw new Error((body as { message?: string } | null)?.message ?? `HTTP ${response.status}`);
      if (!body) return [];
      return unwrapData<Category[]>(body);
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const { data: courses = [], error, isLoading, mutate, isValidating } = useSWR<Course[]>(
    path,
    async (url: string) => {
      const response = await fetch(url);
      const body = await response.json().catch(() => null) as ApiResponse<PagePayload<Course> | Course[]> | PagePayload<Course> | Course[] | null;
      if (!response.ok) throw new Error((body as { message?: string } | null)?.message ?? `HTTP ${response.status}`);
      if (!body) return [];
      return unwrapPageContent<Course>(body);
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
    <Header />
    <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8"><h1 className="text-4xl font-extrabold tracking-tight">Khóa học tiếng Anh</h1><p className="mt-2 max-w-3xl text-gray-500">Danh sách khóa học đang được xuất bản trên St3pLearn.</p></header>

      <section className="mb-8 space-y-5 rounded-2xl border bg-white p-6 shadow-soft">
        <div className="grid gap-3 md:grid-cols-[1fr_240px]"><label className="relative"><Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên hoặc mô tả khóa học..." className="w-full rounded-xl border py-3 pl-10 pr-3 text-sm" /></label><select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-xl border px-3 text-sm"><option value="createdAt-DESC">Mới nhất</option><option value="createdAt-ASC">Cũ nhất</option><option value="price-ASC">Giá thấp đến cao</option><option value="price-DESC">Giá cao đến thấp</option></select></div>
        <div><span className="mb-2 block text-xs font-bold uppercase text-gray-400">Danh mục</span>{categoriesLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : categoriesError ? <p className="text-xs font-bold text-amber-700">Không tải được danh mục: {categoriesError instanceof Error ? categoriesError.message : "Request failed"}</p> : <div className="flex flex-wrap gap-2"><button onClick={() => setCategoryId("ALL")} className={`rounded-xl px-3 py-1.5 text-xs font-bold ${categoryId === "ALL" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>Tất cả</button>{categories.map((category) => <button key={category.id} onClick={() => setCategoryId(category.id)} className={`rounded-xl px-3 py-1.5 text-xs font-bold ${categoryId === category.id ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>{category.name}</button>)}</div>}</div>
        <div><span className="mb-2 block text-xs font-bold uppercase text-gray-400">Trình độ</span><div className="flex flex-wrap gap-2">{levels.map((value) => <button key={value} onClick={() => setLevel(value)} className={`rounded-xl px-3 py-1.5 text-xs font-bold ${level === value ? "bg-secondary text-white" : "bg-gray-100 text-gray-600"}`}>{value === "ALL" ? "Tất cả" : value}</button>)}</div></div>
      </section>

      {isLoading && <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}
      {!isLoading && error && <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center"><h2 className="font-black text-red-700">Không tải được khóa học</h2><p className="mt-2 text-sm text-red-600">{error instanceof Error ? error.message : "Course Service không phản hồi."}</p><button onClick={() => mutate()} disabled={isValidating} className="mx-auto mt-4 flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-bold text-white"><RefreshCw className={`h-4 w-4 ${isValidating ? "animate-spin" : ""}`} />Thử lại</button></div>}
      {!isLoading && !error && courses.length === 0 && <div className="rounded-2xl border border-dashed bg-white py-20 text-center"><BookOpen className="mx-auto h-14 w-14 text-gray-300" /><h2 className="mt-4 text-xl font-bold">Không tìm thấy khóa học</h2><p className="mt-2 text-gray-500">Hãy thay đổi từ khóa hoặc trình độ.</p></div>}
      {!isLoading && !error && courses.length > 0 && <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{courses.map((course) => <CourseCard key={course.id} course={course} />)}</div>}
    </main>
    <Footer />
  </div>;
}
