import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataGridProps<T> {
  items: T[];
  renderItem: (item: T, idx: number) => React.ReactNode;
  itemsPerPage?: number;
  gridClass?: string;
  className?: string;
}

export function DataGrid<T>({
  items,
  renderItem,
  itemsPerPage = 6,
  gridClass = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  className
}: DataGridProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  if (items.length === 0) return null;

  return (
    <div className={cn("space-y-6 w-full", className)}>
      <div className={gridClass}>
        {paginatedItems.map((item, idx) => renderItem(item, idx))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white border border-gray-100 p-4 rounded-2xl shadow-soft shrink-0">
          <span className="text-2xs font-bold text-gray-400 uppercase tracking-wider">
            Trang {currentPage} trên {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-gray-500 border border-gray-100 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-gray-500 border border-gray-100 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
