"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Plus, ThumbsUp, Sparkles, Filter, Hash } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

interface ForumPost {
  id: string;
  title: string;
  author: string;
  content: string;
  channel: "general" | "ielts" | "toeic" | "speaking";
  votes: number;
  commentsCount: number;
  tags: string[];
  createdAt: string;
}

const INITIAL_POSTS: ForumPost[] = [
  {
    id: "post-1",
    title: "Làm sao để cải thiện tốc độ làm bài IELTS Reading Matching Headings?",
    author: "giahan_bui",
    content: "Em thường bị mất nhiều thời gian ở dạng bài Matching Headings, đọc đi đọc lại vẫn hay phân vân giữa 2 đáp án. Ai có mẹo Skimming nhanh xin chỉ giúp em với ạ!",
    channel: "ielts",
    votes: 18,
    commentsCount: 5,
    tags: ["Reading", "Matching Headings", "IELTS"],
    createdAt: "2 giờ trước"
  },
  {
    id: "post-2",
    title: "Tổng hợp 100 Collocations đắt giá nhất cho chủ đề Technology",
    author: "tommy_teacher",
    content: "Chào các em, thầy vừa tổng hợp xong slide PDF 100 cụm từ đồng nghĩa học thuật cực chất cho Writing Task 2 chủ đề Công nghệ. Các em lưu lại ôn tập nhé.",
    channel: "general",
    votes: 45,
    commentsCount: 12,
    tags: ["Vocabulary", "Technology", "Writing"],
    createdAt: "5 giờ trước"
  },
  {
    id: "post-3",
    title: "Review bộ đề thi thử TOEIC Format mới nhất 2026",
    author: "alex_mentor",
    content: "Đề thi thử đợt này có phần nghe Part 3 tốc độ nói nhanh hơn một chút, Part 7 có nhiều từ bẫy đồng nghĩa. Các em lưu ý phần từ vựng chuyên ngành thương mại nhé.",
    channel: "toeic",
    votes: 22,
    commentsCount: 3,
    tags: ["TOEIC", "Listening", "TestPrep"],
    createdAt: "1 ngày trước"
  }
];

export default function ForumPage() {
  const router = useRouter();
  const toast = useToast();
  const [posts, setPosts] = useState<ForumPost[]>(INITIAL_POSTS);
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // New post modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newChannel, setNewChannel] = useState<"general" | "ielts" | "toeic" | "speaking">("general");
  const [newTags, setNewTags] = useState("");

  const handleVote = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, votes: p.votes + 1 } : p))
    );
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    const postTags = newTags
      ? newTags.split(",").map(t => t.trim()).filter(t => t !== "")
      : ["General"];

    const newPost: ForumPost = {
      id: `post-${Date.now()}`,
      title: newTitle,
      author: "Học Viên",
      content: newContent,
      channel: newChannel,
      votes: 1,
      commentsCount: 0,
      tags: postTags,
      createdAt: "Vừa xong"
    };

    setPosts([newPost, ...posts]);
    setIsModalOpen(false);
    
    // Clear form
    setNewTitle("");
    setNewContent("");
    setNewChannel("general");
    setNewTags("");

    toast.success("Đã đăng bài viết mới", "+10 XP cho hoạt động cộng đồng.");
    try {
      const savedXp = localStorage.getItem("edu_xp");
      const currentXp = savedXp ? parseInt(savedXp) : 340;
      localStorage.setItem("edu_xp", (currentXp + 10).toString());
    } catch (err) {}
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesChannel = selectedChannel === "all" || post.channel === selectedChannel;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesChannel && matchesSearch;
  });

  const channels = [
    { key: "all", label: "Tất cả chủ đề" },
    { key: "general", label: "Thảo luận chung" },
    { key: "ielts", label: "Luyện thi IELTS" },
    { key: "toeic", label: "Luyện thi TOEIC" },
    { key: "speaking", label: "Luyện giao tiếp" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Banner */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-pink-100 rounded-3xl p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              EduMastery Forum
            </h1>
            <p className="text-xs text-gray-500">Đặt câu hỏi học thuật, nhận hướng dẫn từ Mentor và kết nối cùng cộng đồng học viên xuất sắc.</p>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="shadow-md shadow-pink-200"
          >
            <Plus className="w-4 h-4 mr-1" />
            Đăng bài viết mới
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Channel Sidebar - Left 1 col */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-4">
              <CardHeader className="p-0 pb-3 mb-3 border-b">
                <CardTitle className="text-sm flex items-center gap-1.5 text-gray-800">
                  <Filter className="w-4 h-4 text-primary" />
                  Phân loại chuyên mục
                </CardTitle>
              </CardHeader>
              <div className="space-y-1">
                {channels.map(ch => (
                  <button
                    key={ch.key}
                    onClick={() => setSelectedChannel(ch.key)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedChannel === ch.key
                        ? "bg-primary text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <Hash className="w-4 h-4" />
                    <span>{ch.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Threads Listing - Right 3 cols */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Input */}
            <Input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm câu hỏi, chủ đề hoặc từ khóa hashtag..."
              className="bg-white shadow-soft"
            />

            {filteredPosts.length === 0 ? (
              <EmptyState
                title="Không có bài viết nào"
                description="Hãy thử đổi từ khóa tìm kiếm hoặc là người đầu tiên đặt câu hỏi trong chuyên mục này!"
                action={
                  <Button onClick={() => setIsModalOpen(true)} size="sm">
                    Gửi câu hỏi đầu tiên
                  </Button>
                }
              />
            ) : (
              <div className="space-y-6">
                {filteredPosts.map(post => (
                  <Card
                    key={post.id}
                    className="hover:shadow-hover cursor-pointer duration-300"
                    onClick={() => router.push(`/forum/post/${post.id}`)}
                  >
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-start gap-4 flex-wrap">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={post.channel === "ielts" ? "default" : post.channel === "toeic" ? "secondary" : "outline"}>
                              {post.channel}
                            </Badge>
                            <span className="text-3xs text-gray-400 font-semibold">
                              Người đăng: <strong className="text-gray-600 font-bold">{post.author}</strong> • {post.createdAt}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-gray-900 text-sm leading-snug group-hover:text-primary transition-colors">
                            {post.title}
                          </h4>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{post.content}</p>

                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.map((tag, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-500 text-4xs font-bold px-2 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Post actions: votes and comments */}
                      <div className="flex items-center gap-6 pt-3 border-t border-gray-50/70 text-xs font-bold text-gray-500">
                        <button
                          onClick={e => handleVote(post.id, e)}
                          className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>{post.votes} lượt thích</span>
                        </button>
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.commentsCount} phản hồi</span>
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Post Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Đăng câu hỏi lên diễn đàn"
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} size="sm">
                Hủy bỏ
              </Button>
              <Button onClick={handleCreatePost} size="sm">
                Đăng bài viết
              </Button>
            </>
          }
        >
          <form className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-3xs font-extrabold uppercase text-gray-400 tracking-wider">Tiêu đề bài viết</label>
              <Input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Nhập tiêu đề ngắn gọn xúc tích thể hiện câu hỏi của bạn..."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-3xs font-extrabold uppercase text-gray-400 tracking-wider">Chuyên mục chính</label>
                <select
                  value={newChannel}
                  onChange={e => setNewChannel(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2.5 outline-none bg-white font-bold text-gray-700 cursor-pointer"
                >
                  <option value="general">Thảo luận chung</option>
                  <option value="ielts">Luyện thi IELTS</option>
                  <option value="toeic">Luyện thi TOEIC</option>
                  <option value="speaking">Luyện giao tiếp</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-3xs font-extrabold uppercase text-gray-400 tracking-wider">Hashtags (Ngăn cách bằng dấu phẩy)</label>
                <Input
                  type="text"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  placeholder="Ví dụ: Reading, Vocabulary, IELTS"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-3xs font-extrabold uppercase text-gray-400 tracking-wider">Nội dung chi tiết câu hỏi</label>
              <textarea
                rows={4}
                required
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Soạn nội dung chi tiết bài viết, thêm ví dụ cụ thể để nhận được câu trả lời chính xác từ cộng đồng và Mentor..."
                className="w-full text-xs rounded-xl border border-gray-200 p-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
          </form>
        </Modal>
      </main>

      <Footer />
    </div>
  );
}
