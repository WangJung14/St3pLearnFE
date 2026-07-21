"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/apiConfig";
import { unwrapData, type ApiResponse } from "@/lib/apiResponses";
import type { CertificateVerification } from "@/lib/endpointTypes";

export default function PublicCertificateVerificationPage() {
  const [code, setCode] = useState(""); const [result, setResult] = useState<CertificateVerification | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const verify = async () => { setLoading(true); setError(""); setResult(null); try { const res = await fetch(`${API_BASE_URL}/api/learning/certificates/verify/${encodeURIComponent(code.trim())}`); if (!res.ok) throw new Error(`HTTP ${res.status}`); setResult(unwrapData<CertificateVerification>(await res.json() as ApiResponse<CertificateVerification>)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Request failed"); } finally { setLoading(false); } };
  return <main className="mx-auto min-h-screen max-w-xl px-4 py-20"><div className="space-y-5 rounded-3xl border bg-white p-8 shadow-soft"><h1 className="text-2xl font-black">Xác minh chứng chỉ</h1><p className="text-sm text-gray-500">Nhập mã trên chứng chỉ St3pLearn.</p><input value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-xl border p-3" placeholder="Certificate code" /><button disabled={!code.trim() || loading} onClick={verify} className="w-full rounded-xl bg-primary p-3 font-bold text-white disabled:opacity-50">{loading ? "Đang xác minh..." : "Xác minh"}</button>{error && <div className="rounded-xl bg-red-50 p-3 text-red-700">{error}</div>}{result && <div className={`rounded-xl p-4 ${(result.isValid ?? result.valid) ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}><b>{result.message}</b><p>{result.studentName} · {result.courseName}</p><p className="text-xs">{result.issueDate}</p></div>}</div></main>;
}
