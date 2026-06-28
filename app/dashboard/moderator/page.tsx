import Link from "next/link";
import { BookOpen, Flag, MessageSquare, ShieldCheck } from "lucide-react";

const MODERATOR_ACTIONS = [
  {
    label: "Theo dõi cộng đồng",
    href: "/forum",
    icon: MessageSquare,
    copy: "Kiểm tra thảo luận mới và phản hồi nội dung cần điều phối.",
  },
  {
    label: "Kiểm tra catalog",
    href: "/courses",
    icon: BookOpen,
    copy: "Xem khóa học public để phát hiện nội dung cần báo cáo.",
  },
  {
    label: "Báo cáo nội dung",
    href: "/chat",
    icon: Flag,
    copy: "Trao đổi nhanh với đội vận hành khi có vấn đề cần xử lý.",
  },
];

export default function ModeratorDashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-2xs font-extrabold uppercase text-emerald-600">Moderator</p>
            <h1 className="text-2xl font-black text-gray-950">Trung tâm điều phối</h1>
            <p className="max-w-2xl text-sm font-medium leading-6 text-gray-500">
              Khu vực dành cho điều phối viên theo dõi cộng đồng, rà soát nội dung và chuyển tiếp báo cáo.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {MODERATOR_ACTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-md"
            >
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="text-sm font-black text-gray-950">{item.label}</h2>
              <p className="mt-2 text-xs font-medium leading-5 text-gray-500">{item.copy}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
