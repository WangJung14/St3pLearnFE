import Link from "next/link";
import { BookOpen } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerSections: FooterSection[] = [
  {
    title: "Learn",
    links: [
      { label: "Courses", href: "/courses" },
      { label: "Pricing", href: "/pricing" },
      { label: "Community", href: "/forum" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", href: "/login" },
      { label: "Register", href: "/register" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Chat", href: "/chat" },
      { label: "Forum", href: "/forum" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-100 bg-white">
      <div className="site-container grid grid-cols-1 gap-8 py-10 md:grid-cols-4">
        <div className="space-y-3 md:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-black text-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-secondary text-white shadow-sm shadow-pink-100">
              <BookOpen className="h-5 w-5" />
            </span>
            St3pLearn
          </Link>
          <p className="site-copy text-sm font-medium leading-relaxed text-gray-500">
            English learning platform for courses, practice, progress, and community.
          </p>
        </div>

        {footerSections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
              {section.title}
            </h3>
            <nav className="grid gap-2">
              {section.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-semibold text-gray-500 transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>
    </footer>
  );
}
