"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { apiFetch } from "./apiFetch";
import { unwrapPageContent, type ApiResponse, type PagePayload } from "./apiResponses";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface WishlistEntry { id: string }

const WISHLIST_PATH = "/api/wishlists?page=0&size=100";

export function useWishlist(courseId?: string, redirectPath?: string) {
  const { token, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const canUseWishlist = Boolean(token && user?.role === "STUDENT");

  const { data: entries = [], mutate } = useSWR<WishlistEntry[]>(
    canUseWishlist ? [WISHLIST_PATH, token] : null,
    async ([path]: readonly [string, string]) => unwrapPageContent<WishlistEntry>(
      await apiFetch<ApiResponse<PagePayload<WishlistEntry> | WishlistEntry[]> | PagePayload<WishlistEntry> | WishlistEntry[]>(path)
    ),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const isSaved = Boolean(courseId && entries.some((entry) => entry.id === courseId));

  const toggle = async () => {
    if (!courseId || isUpdating) return;
    if (!isAuthenticated || !token || user?.role !== "STUDENT") {
      const redirect = redirectPath ?? window.location.pathname;
      router.push(`/student/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    setIsUpdating(true);
    const previous = entries;
    const optimistic = isSaved
      ? entries.filter((entry) => entry.id !== courseId)
      : [...entries, { id: courseId }];
    await mutate(optimistic, { revalidate: false });

    try {
      await apiFetch(
        isSaved ? `/api/wishlists/courses/${courseId}` : `/api/wishlists/course/${courseId}`,
        { method: isSaved ? "DELETE" : "POST" }
      );
      await globalMutate((key) => Array.isArray(key) && String(key[0]).includes("/api/wishlists"));
      toast.success(isSaved ? "Đã xóa khỏi Wishlist" : "Đã thêm vào Wishlist");
    } catch (cause) {
      await mutate(previous, { revalidate: false });
      toast.error("Không thể cập nhật Wishlist", cause instanceof Error ? cause.message : "Request failed");
    } finally {
      setIsUpdating(false);
    }
  };

  return { isSaved, isUpdating, toggle, canUseWishlist };
}
