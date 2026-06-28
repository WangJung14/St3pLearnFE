export type ForumChannel = "general" | "ielts" | "toeic" | "speaking";

export interface ForumPost {
  id: string;
  title: string;
  author: string;
  content: string;
  channel: ForumChannel;
  votes: number;
  commentsCount: number;
  tags: string[];
  createdAt: string;
}

export interface ForumComment {
  id: string;
  postId: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
  votes: number;
}

export const MOCK_FORUM_POSTS: ForumPost[] = [
  {
    id: "post-1",
    title: "Lam sao de cai thien toc do lam bai IELTS Reading Matching Headings?",
    author: "giahan_bui",
    content:
      "Em thuong bi mat nhieu thoi gian o dang bai Matching Headings, doc di doc lai van hay phan van giua 2 dap an. Ai co meo skimming nhanh xin chi giup em voi a!",
    channel: "ielts",
    votes: 18,
    commentsCount: 5,
    tags: ["Reading", "Matching Headings", "IELTS"],
    createdAt: "2 gio truoc",
  },
  {
    id: "post-2",
    title: "Tong hop 100 collocations dat gia nhat cho chu de Technology",
    author: "tommy_teacher",
    content:
      "Chao cac em, thay vua tong hop xong slide PDF 100 cum tu dong nghia hoc thuat cho Writing Task 2 chu de cong nghe. Cac em luu lai on tap nhe.",
    channel: "general",
    votes: 45,
    commentsCount: 12,
    tags: ["Vocabulary", "Technology", "Writing"],
    createdAt: "5 gio truoc",
  },
  {
    id: "post-3",
    title: "Review bo de thi thu TOEIC Format moi nhat 2026",
    author: "alex_mentor",
    content:
      "De thi thu dot nay co phan nghe Part 3 toc do noi nhanh hon mot chut, Part 7 co nhieu tu bay dong nghia. Cac em luu y phan tu vung chuyen nganh thuong mai nhe.",
    channel: "toeic",
    votes: 22,
    commentsCount: 3,
    tags: ["TOEIC", "Listening", "TestPrep"],
    createdAt: "1 ngay truoc",
  },
];

export const MOCK_FORUM_COMMENTS: Record<string, ForumComment[]> = {
  "post-1": [
    {
      id: "comment-1-1",
      postId: "post-1",
      author: "mina_ielts",
      role: "Hoc vien",
      content:
        "Ban thu doc cau dau va cau cuoi moi doan truoc, sau do gach keyword trong heading. Minh thay cach nay giam rat nhieu thoi gian.",
      createdAt: "1 gio truoc",
      votes: 7,
    },
    {
      id: "comment-1-2",
      postId: "post-1",
      author: "alex_mentor",
      role: "Mentor",
      content:
        "Dung tim keyword trung y het. Hay tim paraphrase va muc dich cua doan, vi Matching Headings hay bay bang tu dong nghia.",
      createdAt: "45 phut truoc",
      votes: 12,
    },
  ],
  "post-2": [
    {
      id: "comment-2-1",
      postId: "post-2",
      author: "huywriting",
      role: "Hoc vien",
      content:
        "Phan collocation ve automation rat huu ich cho Task 2. Thay co the them vi du sentence mau khong a?",
      createdAt: "3 gio truoc",
      votes: 4,
    },
    {
      id: "comment-2-2",
      postId: "post-2",
      author: "tommy_teacher",
      role: "Teacher",
      content:
        "Co nhe. Buoi toi thay se cap nhat them sample sentence theo tung topic: AI, privacy, education technology va workplace.",
      createdAt: "2 gio truoc",
      votes: 15,
    },
  ],
  "post-3": [
    {
      id: "comment-3-1",
      postId: "post-3",
      author: "linh_toeic",
      role: "Hoc vien",
      content:
        "Part 7 minh thay hay sai o cau hoi inference. Co nen lam cau hoi truoc roi moi doc passage khong a?",
      createdAt: "20 gio truoc",
      votes: 6,
    },
    {
      id: "comment-3-2",
      postId: "post-3",
      author: "alex_mentor",
      role: "Mentor",
      content:
        "Nen doc cau hoi truoc, nhung dung doc het options qua lau. Voi inference, hay tim cau trong bai co cung y roi suy mot buoc nho.",
      createdAt: "18 gio truoc",
      votes: 11,
    },
    {
      id: "comment-3-3",
      postId: "post-3",
      author: "bao_nguyen",
      role: "Hoc vien",
      content:
        "De format moi co them nhieu email chuoi hoi dap. Minh dang luyen cach scan ten nguoi gui va moc thoi gian truoc.",
      createdAt: "16 gio truoc",
      votes: 3,
    },
  ],
};

export function getForumPostById(postId: string) {
  return MOCK_FORUM_POSTS.find((post) => post.id === postId);
}

export function getForumCommentsByPostId(postId: string) {
  return [...(MOCK_FORUM_COMMENTS[postId] ?? [])];
}

export function getForumChannelLabel(channel: ForumChannel) {
  const labels: Record<ForumChannel, string> = {
    general: "Thao luan chung",
    ielts: "Luyen thi IELTS",
    toeic: "Luyen thi TOEIC",
    speaking: "Luyen giao tiep",
  };

  return labels[channel];
}
