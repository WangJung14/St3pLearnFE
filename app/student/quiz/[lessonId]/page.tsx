"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyQuizRedirect({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  const router = useRouter();
  useEffect(() => { router.replace(`/student/exams/${lessonId}`); }, [lessonId, router]);
  return <div className="p-8 text-center text-sm text-gray-500">Đang chuyển sang bài thi...</div>;
}
