"use client";

import { useState } from "react";
import { Award, Download, Loader2, Search } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import type { CertificateVerification } from "@/lib/endpointTypes";
import { useToast } from "@/components/ui/Toast";
import { API_BASE_URL } from "@/lib/apiConfig";

export default function CertificatesPage() {
  const toast = useToast(); const [certificateId, setCertificateId] = useState(""); const [code, setCode] = useState(""); const [busy, setBusy] = useState(false); const [verification, setVerification] = useState<CertificateVerification | null>(null);
  const download = async () => { if (!certificateId) return; setBusy(true); try { const blob = await apiFetch<Blob>(`/api/learning/certificates/${certificateId}/download`, {}, { responseType: "blob" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "certificate.pdf"; a.click(); URL.revokeObjectURL(url); } catch (cause) { toast.error("Không thể tải chứng chỉ", cause instanceof Error ? cause.message : "Request failed"); } finally { setBusy(false); } };
  const verify = async () => { if (!code) return; setBusy(true); try { const res = await fetch(`${API_BASE_URL}/api/learning/certificates/verify/${encodeURIComponent(code)}`); if (!res.ok) throw new Error(`HTTP ${res.status}`); setVerification(unwrapData<CertificateVerification>(await res.json() as ApiResponse<CertificateVerification>)); } catch (cause) { toast.error("Không thể xác minh", cause instanceof Error ? cause.message : "Request failed"); } finally { setBusy(false); } };
  return <div className="mx-auto max-w-2xl space-y-6"><div><h1 className="flex items-center gap-2 text-2xl font-black"><Award className="text-amber-500" />Chứng chỉ</h1><p className="text-sm text-gray-500">Backend chưa có API liệt kê chứng chỉ; nhập ID/code được cấp.</p></div><section className="space-y-3 rounded-2xl border bg-white p-5"><h2 className="font-black">Tải PDF</h2><div className="flex gap-2"><input value={certificateId} onChange={(e) => setCertificateId(e.target.value)} placeholder="Certificate ID" className="flex-1 rounded-xl border p-3" /><button disabled={!certificateId || busy} onClick={download} className="rounded-xl bg-primary p-3 text-white">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}</button></div></section><section className="space-y-3 rounded-2xl border bg-white p-5"><h2 className="font-black">Xác minh công khai</h2><div className="flex gap-2"><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Certificate code" className="flex-1 rounded-xl border p-3" /><button disabled={!code || busy} onClick={verify} className="rounded-xl bg-secondary p-3 text-white"><Search className="h-4 w-4" /></button></div>{verification && <div className={`rounded-xl p-4 text-sm ${(verification.isValid ?? verification.valid) ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}><b>{verification.message}</b><br />{verification.studentName} · {verification.courseName}</div>}</section></div>;
}
