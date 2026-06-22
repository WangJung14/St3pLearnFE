"use client";

import { X } from "lucide-react";

interface VideoModalProps {
  activePreviewVideo: string | null;
  onClose: () => void;
}

export default function VideoModal({ activePreviewVideo, onClose }: VideoModalProps) {
  if (!activePreviewVideo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/40 text-white hover:bg-black/80 p-2 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="aspect-video w-full">
          <video
            src={activePreviewVideo}
            controls
            autoPlay
            className="w-full h-full object-contain"
          />
        </div>
        <div className="bg-gray-900 p-4 text-white text-center">
          <span className="text-sm font-semibold">Bản xem thử bài học miễn phí</span>
        </div>
      </div>
    </div>
  );
}
