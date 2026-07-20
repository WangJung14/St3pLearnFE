"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { Search, Loader2, User, ChevronLeft, ChevronRight, Mail, Circle, CheckCircle2 } from "lucide-react";

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [page, setPage] = useState(0);
  const size = 10;
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");

  const { data, isLoading, error } = useSWR(
    token ? [`${API_BASE_URL}/api/admin/users?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`, token] : null,
    async ([url, t]) => {
      const res = await fetch(url, { headers: buildAuthHeaders(t) });
      if (!res.ok) throw new Error("Fetch failed");
      const body = await res.json();
      return body.data;
    },
    { revalidateOnFocus: false }
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(search);
    setPage(0);
  };

  const users = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Quản lý người dùng</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách {totalElements} người dùng trên hệ thống</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo ID, Username..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all shadow-sm"
          />
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500 transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-50 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <div className="col-span-1 text-center">STT</div>
          <div className="col-span-4">Người dùng</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Vai trò</div>
          <div className="col-span-2 text-center">Trạng thái</div>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-sm font-semibold">Đang tải danh sách...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 text-sm font-bold">Lỗi tải dữ liệu người dùng.</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm font-bold">Không tìm thấy người dùng nào.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map((user: any, idx: number) => (
              <div 
                key={user.id} 
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-amber-50/30 transition-colors cursor-pointer group"
                onClick={() => alert(`Sẽ hiển thị Modal chi tiết User ${user.username} trong các bản cập nhật tới!`)}
              >
                <div className="col-span-1 text-center text-xs font-bold text-gray-400">
                  {page * size + idx + 1}
                </div>
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-gray-900 truncate group-hover:text-amber-700 transition-colors">{user.username}</p>
                    <p className="text-2xs text-gray-400 truncate" title={user.id}>ID: {user.id.substring(0, 8)}...</p>
                  </div>
                </div>
                <div className="col-span-3 flex items-center gap-2 text-sm text-gray-600 truncate">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="col-span-2 flex flex-wrap gap-1">
                  {user.roles?.map((role: string) => (
                    <span key={role} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-2xs font-extrabold border border-gray-200">
                      {role}
                    </span>
                  ))}
                </div>
                <div className="col-span-2 flex justify-center">
                  {user.status === "ACTIVE" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-200/50">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-bold border border-red-200/50">
                      <Circle className="w-3.5 h-3.5" /> {user.status || "INACTIVE"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Trang trước
            </button>
            <span className="text-xs font-bold text-gray-500">
              Trang <span className="text-gray-900">{page + 1}</span> / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Trang sau <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
