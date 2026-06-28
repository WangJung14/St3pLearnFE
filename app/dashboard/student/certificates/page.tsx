"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Award, Download, Share2, ShieldCheck, Printer } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface Certificate {
  id: string;
  courseTitle: string;
  completionDate: string;
  credentialId: string;
  instructor: string;
}

const MOCK_CERTIFICATES: Certificate[] = [
  {
    id: "cert-1",
    courseTitle: "English Grammar for Beginners & Intermediate",
    completionDate: "25 Tháng 06, 2026",
    credentialId: "EM-GRAM-992384",
    instructor: "Teacher Sarah"
  }
];

export default function CertificatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [certs, setCerts] = useState<Certificate[]>(MOCK_CERTIFICATES);
  const [activeCert, setActiveCert] = useState<Certificate | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = (cert: Certificate) => {
    const verifyUrl = `https://edumastery.com/verify/${cert.credentialId}`;
    navigator.clipboard?.writeText(verifyUrl).catch(() => null);
    toast.success("Đã sao chép link xác thực", verifyUrl);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 print:bg-white">
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-10 space-y-8 print:py-0 print:px-0">
        {/* Back and title - hide on print */}
        <div className="flex items-center justify-between print:hidden">
          <button
            onClick={() => router.push("/dashboard/student")}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Trở về Dashboard</span>
          </button>
        </div>

        {activeCert ? (
          /* Certificate viewer panel */
          <div className="space-y-6">
            {/* Action panel - hide on print */}
            <div className="flex justify-between items-center bg-white rounded-3xl p-4 border border-gray-100 shadow-soft print:hidden flex-wrap gap-4">
              <button
                onClick={() => setActiveCert(null)}
                className="text-xs font-extrabold text-gray-500 hover:text-primary flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại danh sách</span>
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => handleShare(activeCert)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-2xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Chia sẻ link</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-primary text-white text-2xs font-extrabold px-5 py-2.5 rounded-xl shadow-md shadow-pink-200 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In / Lưu PDF</span>
                </button>
              </div>
            </div>

            {/* Realistic digital certificate card */}
            <div className="bg-white rounded-3xl border-[16px] border-amber-800/15 shadow-2xl p-12 text-center space-y-8 relative overflow-hidden max-w-3xl mx-auto border-double print:border-amber-800/20 print:shadow-none print:my-0">
              {/* Gold seal watermark background */}
              <div className="absolute right-0 bottom-0 opacity-5 transform translate-x-12 translate-y-12">
                <Award className="w-80 h-80 text-amber-500" />
              </div>

              {/* Certificate Headings */}
              <div className="space-y-2">
                <span className="text-primary text-3xs font-extrabold tracking-widest uppercase block">Chứng Nhận Tốt Nghiệp</span>
                <h1 className="text-3xl font-black text-amber-800 tracking-wide font-serif">CHỨNG CHỈ HOÀN THÀNH</h1>
                <div className="w-24 h-0.5 bg-amber-600 mx-auto mt-3"></div>
              </div>

              <div className="space-y-6">
                <p className="text-sm text-gray-500 font-medium">Chứng nhận này được trân trọng trao cho</p>
                
                <h2 className="text-4xl font-black text-gray-900 border-b border-gray-100 pb-2 max-w-md mx-auto font-serif">
                  {user?.fullName || "Học Viên EduMastery"}
                </h2>

                <p className="text-sm text-gray-500 leading-relaxed max-w-lg mx-auto">
                  Vì đã hoàn thành xuất sắc khóa học chuyên ngành tiếng Anh học thuật trực tuyến tại hệ thống EduMastery:
                  <strong className="block text-base text-amber-900 font-bold mt-2">"{activeCert.courseTitle}"</strong>
                </p>
              </div>

              {/* Signatures & Seal */}
              <div className="grid grid-cols-3 gap-6 pt-10 items-end">
                <div className="text-center space-y-1 border-t border-gray-150 pt-4">
                  <span className="text-xs font-bold text-gray-800 block">{activeCert.instructor}</span>
                  <span className="text-4xs text-gray-400 font-bold uppercase tracking-wider">Giảng viên hướng dẫn</span>
                </div>

                {/* Gold Seal graphic */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 flex flex-col items-center justify-center text-white border-4 border-white shadow-lg relative">
                    <Award className="w-10 h-10" />
                    <div className="absolute inset-2 border border-dashed border-white/50 rounded-full"></div>
                  </div>
                  <span className="text-4xs text-amber-700 font-extrabold uppercase mt-2 block tracking-wider">EduMastery Seal</span>
                </div>

                <div className="text-center space-y-1 border-t border-gray-150 pt-4">
                  <span className="text-xs font-bold text-gray-800 block">EduMastery Board</span>
                  <span className="text-4xs text-gray-400 font-bold uppercase tracking-wider">Ban điều hành học viện</span>
                </div>
              </div>

              {/* Footer Credentials */}
              <div className="pt-8 border-t border-gray-50 flex flex-wrap justify-between text-4xs text-gray-400 font-semibold uppercase tracking-wider gap-4">
                <span className="flex items-center gap-1 text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Xác thực hệ thống an toàn</span>
                </span>
                <span>Ngày cấp: {activeCert.completionDate}</span>
                <span>Mã chứng chỉ: {activeCert.credentialId}</span>
              </div>
            </div>
          </div>
        ) : (
          /* List of certificates */
          <div className="space-y-6 print:hidden">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <Award className="w-6 h-6 text-primary" />
                Chứng chỉ học tập của tôi
              </h1>
              <p className="text-xs text-gray-500">Xem và lưu trữ chứng chỉ danh giá khi bạn hoàn thành 100% nội dung khóa học.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certs.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-soft hover:shadow-hover p-6 flex flex-col justify-between gap-4 transition-all"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 text-primary flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-gray-900 text-sm leading-snug">{cert.courseTitle}</h3>
                    <p className="text-xs text-gray-400">Ngày cấp: {cert.completionDate}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <span className="text-4xs font-bold text-gray-400">ID: {cert.credentialId}</span>
                    <button
                      onClick={() => setActiveCert(cert)}
                      className="bg-primary/10 text-primary hover:bg-primary/20 text-xs font-black py-2 px-4 rounded-xl transition-all cursor-pointer"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
