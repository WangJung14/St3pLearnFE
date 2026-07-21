"use client";

import { useState } from "react";
import useSWR from "swr";
import { Hash, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import { taxonomyNameSchema } from "@/lib/validations";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

type FormValues = z.infer<typeof taxonomyNameSchema>;
interface Tag { id: string; name: string; slug?: string }

export default function AdminTagsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState<Tag | null>(null);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(taxonomyNameSchema), defaultValues: { name: "" } });

  const { data: tags = [], error, isLoading, mutate } = useSWR<Tag[]>(
    token ? ["/api/tags", token] : null,
    async ([path]: readonly [string, string]) => unwrapData<Tag[]>(await apiFetch<ApiResponse<Tag[]> | Tag[]>(path)),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const clear = () => { setEditing(null); reset({ name: "" }); };
  const submit = async (values: FormValues) => {
    if (!token) return;
    setSaving(true);
    try {
      await apiFetch(editing ? `/api/tags/${editing.id}` : "/api/tags", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({ name: values.name.trim() }),
      });
      clear(); await mutate(); toast.success(editing ? "Đã cập nhật tag" : "Đã tạo tag");
    } catch (cause) { toast.error("Không thể lưu tag", cause instanceof Error ? cause.message : undefined); }
    finally { setSaving(false); }
  };
  const remove = async (tag: Tag) => {
    if (!confirm(`Xóa tag “${tag.name}”?`)) return;
    try { await apiFetch(`/api/tags/${tag.id}`, { method: "DELETE" }); await mutate(); toast.success("Đã xóa tag"); }
    catch (cause) { toast.error("Không thể xóa tag", cause instanceof Error ? cause.message : undefined); }
  };

  return <RoleGuard allow={["ADMIN"]}><div className="space-y-6">
    <header><h1 className="flex items-center gap-2 text-2xl font-black"><Hash className="text-secondary" />Quản lý Tags</h1><p className="text-sm text-gray-500">Tạo, sửa và xóa tag dùng trong catalog khóa học.</p></header>
    {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Không kết nối được <code>/api/tags</code>: {error instanceof Error ? error.message : "Request failed"}. Nếu nhận HTTP 404, Gateway cần expose route này.</div>}
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <form onSubmit={handleSubmit(submit)} className="h-fit space-y-4 rounded-2xl border bg-white p-5"><h2 className="font-black">{editing ? "Sửa tag" : "Tạo tag"}</h2><label className="block text-xs font-bold text-gray-500">Tên tag<input {...register("name")} placeholder="Ví dụ: IELTS Writing" className="mt-1 w-full rounded-xl border p-3 text-sm" /></label>{errors.name?.message && <p className="text-xs text-red-600">{errors.name.message}</p>}<div className="flex gap-2"><button disabled={saving} type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{editing ? "Cập nhật" : "Tạo tag"}</button>{editing && <button type="button" onClick={clear} className="rounded-xl border p-3"><X className="h-4 w-4" /></button>}</div></form>
      <section className="overflow-hidden rounded-2xl border bg-white">{isLoading && <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-secondary" /></div>}{!isLoading && !error && tags.length === 0 && <div className="p-12 text-center text-sm text-gray-500">Chưa có tag nào.</div>}{!isLoading && !error && tags.map((tag) => <div key={tag.id} className="flex items-center justify-between border-b p-4 last:border-0"><div><b>{tag.name}</b>{tag.slug && <p className="text-xs text-gray-400">{tag.slug}</p>}</div><div className="flex gap-2"><button onClick={() => { setEditing(tag); setValue("name", tag.name); }} className="rounded-lg border p-2 text-gray-500"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(tag)} className="rounded-lg bg-red-50 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div></div>)}</section>
    </div>
  </div></RoleGuard>;
}
