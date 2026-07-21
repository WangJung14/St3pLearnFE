"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function CourseReportForm({ courseId }: { courseId: string }) {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isAuthenticated || !["STUDENT", "TEACHER"].includes(user?.role ?? "")) return null;

  const submit = async () => {
    if (reason.trim().length < 3) {
      toast.warning("Vui lòng nhập lý do báo cáo");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({ targetType: "COURSE", targetId: courseId, reason, description }),
      });
      toast.success("Đã gửi báo cáo", "Quản trị viên sẽ xem xét nội dung này.");
      setOpen(false);
      setReason("");
      setDescription("");
    } catch (error) {
      toast.error("Không thể gửi báo cáo", error instanceof Error ? error.message : "Gateway chưa route /api/reports.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-red-600">
        <Flag className="h-4 w-4" /> Báo cáo khóa học
      </button>
      <Modal
        isOpen={open}
        onClose={() => !saving && setOpen(false)}
        title="Báo cáo khóa học"
        className="w-full max-w-lg"
        footer={
          <button disabled={saving} onClick={submit} className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gửi báo cáo"}
          </button>
        }
      >
        <div className="space-y-4">
          <label className="block font-bold text-gray-700">Lý do
            <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2" placeholder="Ví dụ: Nội dung không phù hợp" />
          </label>
          <label className="block font-bold text-gray-700">Mô tả chi tiết
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2" />
          </label>
          <p className="rounded-xl bg-amber-50 p-3 text-amber-800">Nếu request trả 404, Gateway Backend chưa route <code>/api/reports</code>.</p>
        </div>
      </Modal>
    </>
  );
}
