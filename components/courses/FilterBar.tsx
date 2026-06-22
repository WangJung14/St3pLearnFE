"use client";

import { Search, Filter } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface FilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedLevel: string;
  setSelectedLevel: (val: string) => void;
  sortField: string;
  sortDirection: string;
  setSortField: (val: string) => void;
  setSortDirection: (val: string) => void;
  categories: Category[];
  levelsList: string[];
}

export default function FilterBar({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  selectedLevel,
  setSelectedLevel,
  sortField,
  sortDirection,
  setSortField,
  setSortDirection,
  categories,
  levelsList,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 mb-8 border border-gray-100 space-y-6">
      {/* Row 1: Search and Sort */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên khóa học, mô tả ngắn..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split("-");
              setSortField(field);
              setSortDirection(direction);
            }}
            className="block w-full py-3 px-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="createdAt-DESC">Mới nhất trước</option>
            <option value="createdAt-ASC">Cũ nhất trước</option>
            <option value="price-ASC">Giá từ thấp đến cao</option>
            <option value="price-DESC">Giá từ cao đến thấp</option>
          </select>
        </div>
      </div>

      {/* Row 2: Categories Filters */}
      <div>
        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Chuyên mục đào tạo
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              selectedCategory === "All"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                selectedCategory === cat.name
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Row 3: Level Filters */}
      <div>
        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Trình độ đầu ra
        </span>
        <div className="flex flex-wrap gap-2">
          {levelsList.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedLevel === lvl
                  ? "bg-secondary text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {lvl === "All" ? "Tất cả" : lvl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
