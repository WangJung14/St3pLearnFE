"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, LogOut, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  const navLinks = isAuthenticated
    ? [
        { label: 'Courses', href: '/courses' },
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Live Classes', href: '#' },
        { label: 'Community', href: '#' },
      ]
    : [
        { label: 'Courses', href: '/courses' },
        { label: 'Live Classes', href: '#' },
        { label: 'Community', href: '#' },
        { label: 'About', href: '#' },
      ];

  return (
    <header className="sticky top-0 w-full shadow-md bg-surface-container-lowest z-50 border-b border-gray-100">
      <div className="flex justify-between items-center w-full px-lg max-w-container-max mx-auto h-20">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link
            className="text-headline-md font-headline-md font-extrabold text-primary flex items-center gap-2 hover:opacity-90 transition-opacity"
            href="/"
          >
            <div className="bg-primary/10 p-2 rounded-xl">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <span>St3pLearn</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {navLinks.map((link, index) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={index}
                  className={`font-body-md text-body-md transition-all py-1 px-2 rounded-md ${
                    isActive
                      ? 'text-primary font-bold bg-primary/5'
                      : 'text-secondary hover:text-primary hover:bg-gray-50'
                  }`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Auth Buttons / Profile info */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                <div className="bg-primary text-white p-1 rounded-full">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {user?.fullName || user?.username}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 font-label-md text-label-md text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-200 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="font-label-md text-label-md text-secondary hover:text-primary transition-colors">
                Login
              </Link>
              <Link href="/register" className="font-label-md text-label-md bg-primary text-on-primary px-6 py-2 rounded-lg shadow-sm hover:bg-primary-container transition-all">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

