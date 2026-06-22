"use client";

import { ChevronDown, ChevronUp, PlayCircle, Clock, BookOpen, Lock } from "lucide-react";

export interface Lesson {
  id: string;
  title: string;
  orderIndex: number;
  duration?: number;
  isPreview: boolean;
  videoUrl?: string;
}

export interface Chapter {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface ChapterAccordionProps {
  curriculum: Chapter[];
  expandedChapters: Record<string, boolean>;
  toggleChapter: (chapterId: string) => void;
  setActivePreviewVideo: (videoUrl: string) => void;
}

export default function ChapterAccordion({
  curriculum,
  expandedChapters,
  toggleChapter,
  setActivePreviewVideo,
}: ChapterAccordionProps) {
  return (
    <div className="space-y-4">
      {curriculum.map((chapter) => {
        const isExpanded = expandedChapters[chapter.id] !== false; // Default expanded
        return (
          <div key={chapter.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Chapter Header */}
            <button
              onClick={() => toggleChapter(chapter.id)}
              className="w-full flex justify-between items-center bg-gray-50/50 px-5 py-4 text-left font-bold text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary shrink-0" />
                <span>{chapter.title}</span>
              </div>
              <span className="text-gray-400">
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </span>
            </button>

            {/* Lessons List */}
            {isExpanded && (
              <div className="divide-y divide-gray-100 bg-white">
                {chapter.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-all"
                  >
                    <div className="flex items-center gap-3 pr-4">
                      {lesson.isPreview ? (
                        <button
                          onClick={() => lesson.videoUrl && setActivePreviewVideo(lesson.videoUrl)}
                          className="text-primary hover:text-primary-container shrink-0 cursor-pointer"
                          title="Xem thử miễn phí"
                        >
                          <PlayCircle className="w-5 h-5" />
                        </button>
                      ) : (
                        <Lock className="w-5 h-5 text-gray-400 shrink-0" />
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {lesson.orderIndex}. {lesson.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {lesson.duration && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {lesson.duration} phút
                        </span>
                      )}
                      {lesson.isPreview && (
                        <button
                          onClick={() => lesson.videoUrl && setActivePreviewVideo(lesson.videoUrl)}
                          className="bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
                        >
                          Học thử
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
