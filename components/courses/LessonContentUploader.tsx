"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Upload, MonitorPlay } from "lucide-react";
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
  token,
  onUploaded,
}: LessonContentUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "youtube" | "text">("upload");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
