"use client";

import { use, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Hash,
  MessageSquare,
  Send,
  ThumbsUp,
  UserCircle2,
} from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import {
  getForumChannelLabel,
  getForumCommentsByPostId,
  getForumPostById,
  type ForumComment,
} from "@/lib/forumMock";

interface ForumPostDetailPageProps {
  params: Promise<{ postId: string }>;
}

export default function ForumPostDetailPage({ params }: ForumPostDetailPageProps) {
  const { postId } = use(params);
  const post = useMemo(() => getForumPostById(postId), [postId]);
  const initialComments = useMemo(() => getForumCommentsByPostId(postId), [postId]);
  const [comments, setComments] = useState<ForumComment[]>(initialComments);
  const [reply, setReply] = useState("");
  const [votes, setVotes] = useState(post?.votes ?? 0);
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();

  const handleVote = () => {
    setVotes((current) => current + 1);
    toast.success("Da ghi nhan luot thich", "Cam on ban da dong gop cho cong dong.");
  };

  const handleReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = reply.trim();
    if (!content) return;

    if (!isAuthenticated) {
      toast.warning("Can dang nhap", "Dang nhap de gui phan hoi tren dien dan.");
      return;
    }

    const nextComment: ForumComment = {
      id: `local-${Date.now()}`,
      postId,
      author: user?.fullName ?? user?.username ?? "Ban",
      role: user?.role ?? "Hoc vien",
      content,
      createdAt: "Vua xong",
      votes: 0,
    };

    setComments((current) => [nextComment, ...current]);
    setReply("");
    toast.success("Da them phan hoi", "Phan hoi duoc luu trong phien hien tai.");
  };

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto flex w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
          <EmptyState
            title="Khong tim thay bai viet"
            description="Bai viet forum nay chua co trong du lieu hien tai."
            action={
              <Link
                href="/forum"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white transition hover:bg-primary/90"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lai forum
              </Link>
            }
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <Header />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/forum"
          className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lai forum
        </Link>

        <article className="space-y-6">
          <Card>
            <CardContent className="space-y-6 p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={post.channel === "ielts" ? "default" : post.channel === "toeic" ? "secondary" : "outline"}>
                  {getForumChannelLabel(post.channel)}
                </Badge>
                <span className="text-xs font-semibold text-gray-400">
                  {post.author} • {post.createdAt}
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl font-black leading-tight text-gray-950 sm:text-3xl">
                  {post.title}
                </h1>
                <p className="text-sm font-medium leading-7 text-gray-600">
                  {post.content}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500"
                  >
                    <Hash className="h-3.5 w-3.5" />
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 text-xs font-bold text-gray-500">
                <button
                  type="button"
                  onClick={handleVote}
                  className="inline-flex items-center gap-1.5 transition hover:text-primary"
                >
                  <ThumbsUp className="h-4 w-4" />
                  {votes} luot thich
                </button>
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  {comments.length} phan hoi
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-5 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-black text-gray-950">Phan hoi</h2>
                  <p className="text-xs font-medium text-gray-500">
                    Chia se cach giai, tai lieu hoac trai nghiem hoc tap cua ban.
                  </p>
                </div>
                <Badge variant="outline">{comments.length}</Badge>
              </div>

              <form onSubmit={handleReply} className="space-y-3">
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  rows={4}
                  placeholder="Viet phan hoi cua ban..."
                  className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 text-sm font-medium text-gray-700 outline-none transition focus:border-transparent focus:ring-2 focus:ring-primary"
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={!reply.trim()}>
                    <Send className="h-4 w-4" />
                    Gui phan hoi
                  </Button>
                </div>
              </form>

              <div className="space-y-3">
                {comments.length === 0 ? (
                  <EmptyState
                    title="Chua co phan hoi"
                    description="Hay la nguoi dau tien chia se goc nhin cho bai viet nay."
                  />
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <UserCircle2 className="h-8 w-8 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-gray-900">
                              {comment.author}
                            </p>
                            <p className="text-xs font-semibold text-gray-400">
                              {comment.role} • {comment.createdAt}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-400">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {comment.votes}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-6 text-gray-600">
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </article>
      </main>

      <Footer />
    </div>
  );
}
