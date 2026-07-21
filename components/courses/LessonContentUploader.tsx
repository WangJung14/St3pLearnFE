"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { AlertCircle, CheckCircle2, Loader2, Upload, MonitorPlay, Link2, Brain } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";

type SupportedContentType = "VIDEO_CLOUDINARY" | "AUDIO_CLOUDINARY" | "PDF_CLOUDINARY";
type CloudinaryResourceType = "video" | "raw";

interface UploadSignature {
  signature: string;
  timestamp: number;
  api_key: string;
  folder: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  resource_type?: string;
  format?: string;
  bytes?: number;
  duration?: number;
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
}

interface LessonContentUploaderProps {
  courseId: string;
  chapterId: string;
  lessonId: string;
  lessonType?: string;
  token: string | null;
  onUploaded: () => void | Promise<unknown>;
}

const MAX_FILE_BYTES = 500 * 1024 * 1024;

function resolveContentType(file: File): {
  contentType: SupportedContentType;
  resourceType: CloudinaryResourceType;
} {
  if (file.type.startsWith("video/")) {
    return { contentType: "VIDEO_CLOUDINARY", resourceType: "video" };
  }

  if (file.type.startsWith("audio/")) {
    return { contentType: "AUDIO_CLOUDINARY", resourceType: "video" };
  }

  if (file.type === "application/pdf") {
    return { contentType: "PDF_CLOUDINARY", resourceType: "raw" };
  }

  throw new Error("Chỉ hỗ trợ video, audio hoặc PDF.");
}

function unwrapData<T>(body: ApiResponse<T> | T): T {
  return (body as ApiResponse<T>).data ?? (body as T);
}

// Hàm trích xuất video ID từ link Youtube
function extractYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function LessonContentUploader({
  courseId,
  chapterId,
  lessonId,
  lessonType,
  token,
  onUploaded,
}: LessonContentUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const aiFileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "youtube" | "text" | "ai_doc">("upload");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [aiTextContent, setAiTextContent] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Tải danh sách đề thi/bài tập trắc nghiệm đã tạo của khóa học
  const { data: exams = [] } = useSWR<any[]>(
    lessonType === "QUIZ" && token ? [`${API_BASE_URL}/api/learning/courses/${courseId}/exams`, token] as const : null,
    async ([url, currentToken]: readonly [string, string]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(currentToken) });
      if (!res.ok) return [];
      const body = await res.json();
      return unwrapData(body) || [];
    },
    { revalidateOnFocus: false }
  );

  const handleFile = async (file: File | undefined) => {
    setMessage("");
    setErrorMessage("");

    if (!file) return;
    if (!token) {
      setErrorMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setErrorMessage("File vượt quá giới hạn 500MB.");
      return;
    }

    // Xử lý trực tiếp file PDF upload thẳng lên server không qua Cloudinary
    if (file.type === "application/pdf") {
      setIsUploading(true);
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const dataUrl = reader.result as string;
            const saveRes = await fetch(
              `${API_BASE_URL}/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/content`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...buildAuthHeaders(token),
                },
                body: JSON.stringify({
                  contentType: "PDF_CLOUDINARY",
                  storageUrl: dataUrl,
                  fileSize: file.size,
                  metadata: {
                    originalFilename: file.name,
                  },
                }),
              }
            );
            const saveBody = await saveRes.json().catch(() => null);
            if (!saveRes.ok) {
              throw new Error(saveBody?.message ?? "Không lưu được file PDF lên server");
            }
            setMessage("Đã tải và lưu file PDF trực tiếp lên server thành công.");
            await onUploaded();
          } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : "Upload PDF thất bại");
          } finally {
            setIsUploading(false);
            if (inputRef.current) inputRef.current.value = "";
          }
        };
        reader.readAsDataURL(file);
      } catch (err: unknown) {
        setErrorMessage("Không đọc được tệp PDF.");
        setIsUploading(false);
      }
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      setErrorMessage("Thiếu NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME để upload Cloudinary.");
      return;
    }

    let resolved;
    try {
      resolved = resolveContentType(file);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "File không hợp lệ.");
      return;
    }

    setIsUploading(true);
    try {
      const signatureRes = await fetch(
        `${API_BASE_URL}/api/courses/${courseId}/chapters/${chapterId}/lessons/upload-signature`,
        { headers: buildAuthHeaders(token) }
      );
      const signatureBody = await signatureRes.json().catch(() => null) as ApiResponse<UploadSignature> | null;
      if (!signatureRes.ok || !signatureBody) {
        throw new Error(signatureBody?.message ?? "Không lấy được upload signature");
      }

      const signature = unwrapData(signatureBody);
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", signature.api_key);
      form.append("timestamp", String(signature.timestamp));
      form.append("signature", signature.signature);
      form.append("folder", signature.folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resolved.resourceType}/upload`,
        {
          method: "POST",
          body: form,
        }
      );
      const uploadBody = await uploadRes.json().catch(() => null) as CloudinaryUploadResponse & { error?: { message?: string } } | null;
      if (!uploadRes.ok || !uploadBody?.secure_url) {
        throw new Error(uploadBody?.error?.message ?? "Upload Cloudinary thất bại");
      }

      const saveRes = await fetch(
        `${API_BASE_URL}/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(token),
          },
          body: JSON.stringify({
            contentType: resolved.contentType,
            storageUrl: uploadBody.secure_url,
            fileSize: uploadBody.bytes ?? file.size,
            metadata: {
              publicId: uploadBody.public_id,
              resourceType: uploadBody.resource_type ?? resolved.resourceType,
              format: uploadBody.format,
              duration: uploadBody.duration,
              originalFilename: file.name,
            },
          }),
        }
      );
      const saveBody = await saveRes.json().catch(() => null) as { message?: string } | null;
      if (!saveRes.ok) {
        throw new Error(saveBody?.message ?? "Không lưu được nội dung bài học");
      }

      setMessage("Đã upload và lưu nội dung bài học.");
      await onUploaded();
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Upload thất bại";
      setErrorMessage(error);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleSaveYoutube = async () => {
    setMessage("");
    setErrorMessage("");

    if (!token) {
      setErrorMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      setErrorMessage("Link YouTube không hợp lệ.");
      return;
    }

    setIsUploading(true);
    try {
      const saveRes = await fetch(
        `${API_BASE_URL}/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(token),
          },
          body: JSON.stringify({
            contentType: "VIDEO_YOUTUBE",
            storageUrl: `https://www.youtube.com/embed/${videoId}`,
            fileSize: 0,
            metadata: {
              videoId,
              source: "youtube",
            },
          }),
        }
      );
      const saveBody = await saveRes.json().catch(() => null) as { message?: string } | null;
      if (!saveRes.ok) {
        throw new Error(saveBody?.message ?? "Không lưu được nội dung YouTube");
      }

      setMessage("Đã lưu video YouTube thành công.");
      setYoutubeUrl("");
      await onUploaded();
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Lỗi khi lưu link YouTube";
      setErrorMessage(error);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSaveText = async () => {
    setMessage("");
    setErrorMessage("");

    if (!token) {
      setErrorMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    setIsUploading(true);
    try {
      const saveRes = await fetch(
        `${API_BASE_URL}/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(token),
          },
          body: JSON.stringify({
            contentType: "TEXT",
            storageUrl: "TEXT_CONTENT",
            fileSize: textContent.length,
            textContent: textContent,
          }),
        }
      );
      const saveBody = await saveRes.json().catch(() => null) as { message?: string } | null;
      if (!saveRes.ok) {
        throw new Error(saveBody?.message ?? "Không lưu được nội dung bài học");
      }

      setMessage("Đã lưu nội dung soạn thảo thành công.");
      await onUploaded();
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Lỗi khi lưu bài viết";
      setErrorMessage(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLinkExam = async () => {
    setMessage("");
    setErrorMessage("");

    if (!selectedExamId) {
      setErrorMessage("Vui lòng chọn một đề thi/bài tập.");
      return;
    }
    if (!token) {
      setErrorMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    setIsUploading(true);
    try {
      const saveRes = await fetch(
        `${API_BASE_URL}/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(token),
          },
          body: JSON.stringify({
            contentType: "QUIZ",
            storageUrl: selectedExamId,
            fileSize: 0,
          }),
        }
      );
      const saveBody = await saveRes.json().catch(() => null) as { message?: string } | null;
      if (!saveRes.ok) {
        throw new Error(saveBody?.message ?? "Không liên kết được bài kiểm tra");
      }

      setMessage("Đã liên kết bài kiểm tra thành công.");
      await onUploaded();
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Lỗi khi liên kết bài thi";
      setErrorMessage(error);
    } finally {
      setIsUploading(false);
    }
  };

  // UI đặc biệt cho bài học loại QUIZ (Trắc nghiệm/Kiểm tra)
  if (lessonType === "QUIZ") {
    return (
      <div className="space-y-3 bg-gray-50/50 p-4 border border-gray-100 rounded-2xl w-[320px]">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider flex items-center gap-1">
            <Link2 className="w-3.5 h-3.5 text-primary" />
            Chọn Bài Kiểm Tra để liên kết
          </label>
          <div className="flex items-center gap-2">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              disabled={isUploading}
              className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold bg-white"
            >
              <option value="">-- Chọn bài kiểm tra --</option>
              {exams.map((exam: any) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({exam.durationMinutes}m)
                </option>
              ))}
            </select>
            <button
              onClick={handleLinkExam}
              disabled={!selectedExamId || isUploading}
              className="inline-flex items-center gap-1 rounded-xl bg-primary hover:opacity-90 px-4 py-2.5 text-xs font-extrabold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 shrink-0 cursor-pointer"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gán bài"}
            </button>
          </div>
          {exams.length === 0 && (
            <p className="text-3xs text-amber-600 font-bold leading-normal">
              * Khóa học này chưa có bài kiểm tra nào được xuất bản. Vui lòng tạo đề thi trước trong menu Quản lý Đề thi.
            </p>
          )}
        </div>

        {message && (
          <p className="flex items-center gap-1 text-3xs font-bold text-emerald-600 mt-2">
            <CheckCircle2 className="h-3 w-3" />
            {message}
          </p>
        )}

        {errorMessage && (
          <p className="flex max-w-xs items-start gap-1 text-3xs font-bold text-red-600 mt-2">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => {
            setActiveTab("upload");
            setMessage("");
            setErrorMessage("");
          }}
          className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 ${
            activeTab === "upload" ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-900"
          }`}
        >
          Tải lên thiết bị
        </button>
        <button
          onClick={() => {
            setActiveTab("youtube");
            setMessage("");
            setErrorMessage("");
          }}
          className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1 border-b-2 ${
            activeTab === "youtube" ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-900"
          }`}
        >
          <MonitorPlay className="w-4 h-4 text-red-500" />
          Link YouTube
        </button>
        <button
          onClick={() => {
            setActiveTab("text");
            setMessage("");
            setErrorMessage("");
          }}
          className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 ${
            activeTab === "text" ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-900"
          }`}
        >
          Soạn bằng tay
        </button>
        <button
          onClick={() => {
            setActiveTab("ai_doc");
            setMessage("");
            setErrorMessage("");
          }}
          className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 flex items-center gap-1 ${
            activeTab === "ai_doc" ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-900"
          }`}
        >
          <Brain className="w-4 h-4 text-purple-600" />
          Nạp tri thức AI
        </button>
      </div>

      {activeTab === "upload" && (
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,application/pdf"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1 rounded-xl bg-secondary/10 px-3 py-2 text-3xs font-black text-secondary transition-colors hover:bg-secondary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {isUploading ? "Đang xử lý..." : "Tải nội dung"}
          </button>
        </div>
      )}

      {activeTab === "youtube" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ví dụ: https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={isUploading}
              className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              onClick={handleSaveYoutube}
              disabled={!youtubeUrl || isUploading}
              className="inline-flex items-center gap-1 rounded-xl bg-red-500 hover:bg-red-600 px-3 py-2 text-3xs font-black text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Lưu Video"}
            </button>
          </div>
          <p className="text-3xs text-gray-400">Hỗ trợ các định dạng youtube.com/watch?v=... hoặc youtu.be/...</p>
        </div>
      )}
      
      {activeTab === "text" && (
        <div className="flex flex-col gap-2">
          <textarea
            placeholder="Soạn thảo nội dung văn bản bài học..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            disabled={isUploading}
            rows={8}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans leading-relaxed"
          />
          <button
            onClick={handleSaveText}
            disabled={!textContent || isUploading}
            className="inline-flex items-center gap-1 rounded-xl bg-primary hover:opacity-90 px-3 py-2 text-3xs font-black text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 self-start"
          >
            {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Lưu bài học"}
          </button>
        </div>
      )}

      {activeTab === "ai_doc" && (
        <div className="flex flex-col gap-3 bg-purple-50/50 p-4 border border-purple-100 rounded-2xl">
          <div className="space-y-1">
            <h4 className="text-xs font-black text-purple-900 flex items-center gap-1">
              <Brain className="w-4 h-4 text-purple-600" /> Nạp tài liệu tri thức cho Trợ lý AI
            </h4>
            <p className="text-3xs font-bold text-purple-700">
              Tải file Word (.docx), PDF (.pdf) hoặc nhập văn bản thô để Admin duyệt trước khi AI học.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={aiFileInputRef}
              type="file"
              accept=".docx,.pdf,.txt"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !token) return;
                setIsUploading(true);
                setMessage("");
                setErrorMessage("");
                try {
                  const form = new FormData();
                  form.append("file", file);
                  form.append("title", file.name);

                  const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/documents/upload`, {
                    method: "POST",
                    headers: buildAuthHeaders(token, "TEACHER"),
                    body: form,
                  });
                  if (!res.ok) throw new Error("Không gửi được tài liệu cho AI");
                  setMessage("Đã gửi tệp (.docx/.pdf) cho Admin duyệt nạp vào AI thành công!");
                } catch (err: unknown) {
                  setErrorMessage(err instanceof Error ? err.message : "Upload thất bại");
                } finally {
                  setIsUploading(false);
                  if (aiFileInputRef.current) aiFileInputRef.current.value = "";
                }
              }}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => aiFileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-3xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Tải file .docx / .pdf cho AI
              </button>
            </div>

            <div className="pt-2 border-t border-purple-100 space-y-2">
              <label className="text-3xs font-black text-purple-800">Hoặc nhập đoạn văn bản kiến thức:</label>
              <textarea
                placeholder="Nhập kiến thức chuyên ngành, bài học hoặc ghi chú cho AI..."
                value={aiTextContent}
                onChange={(e) => setAiTextContent(e.target.value)}
                rows={3}
                className="w-full p-2.5 text-xs border border-purple-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 font-bold"
              />
              <button
                disabled={!aiTextContent.trim() || isUploading}
                onClick={async () => {
                  if (!token || !aiTextContent.trim()) return;
                  setIsUploading(true);
                  setMessage("");
                  setErrorMessage("");
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/documents/text`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...buildAuthHeaders(token, "TEACHER"),
                      },
                      body: JSON.stringify({
                        title: "Văn bản tri thức giáo viên nhập",
                        textContent: aiTextContent.trim(),
                      }),
                    });
                    if (!res.ok) throw new Error("Không gửi được văn bản");
                    setMessage("Đã gửi văn bản tri thức cho Admin kiểm duyệt thành công!");
                    setAiTextContent("");
                  } catch (err: unknown) {
                    setErrorMessage(err instanceof Error ? err.message : "Gửi văn bản thất bại");
                  } finally {
                    setIsUploading(false);
                  }
                }}
                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-black text-3xs rounded-lg transition-all border border-purple-200 cursor-pointer disabled:opacity-50"
              >
                Gửi văn bản cho AI
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <p className="flex items-center gap-1 text-3xs font-bold text-emerald-600 mt-2">
          <CheckCircle2 className="h-3 w-3" />
          {message}
        </p>
      )}

      {errorMessage && (
        <p className="flex max-w-xs items-start gap-1 text-3xs font-bold text-red-600 mt-2">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  );
}
