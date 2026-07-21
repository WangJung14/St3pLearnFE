"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentExamLauncherPage() {
  const [examId, setExamId] = useState(""); const router = useRouter();
  return <div className="mx-auto max-w-lg space-y-4 rounded-3xl border bg-white p-8 shadow-soft"><h1 className="text-2xl font-black">Mở bài thi</h1><p className="text-sm text-gray-500">Backend chưa có API liệt kê bài thi dành cho Student. Nhập Exam ID do giảng viên cung cấp.</p><input value={examId} onChange={(e) => setExamId(e.target.value)} placeholder="Exam ID" className="w-full rounded-xl border p-3" /><button disabled={!examId.trim()} onClick={() => router.push(`/student/exams/${examId.trim()}`)} className="w-full rounded-xl bg-primary p-3 font-bold text-white disabled:opacity-50">Mở bài thi</button></div>;
}
