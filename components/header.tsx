import Link from 'next/link';

export default function Header() {
  const navLinks = [
    { label: 'Courses', href: '#' },
    { label: 'Categories', href: '#' },
    { label: 'Live Classes', href: '#' },
    { label: 'Community', href: '#' },
    { label: 'About', href: '#' },
  ];

  return (
    <header className="sticky top-0 w-full shadow-md bg-surface-container-lowest z-50">
      <div className="flex justify-between items-center w-full px-lg max-w-container-max mx-auto h-20">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link
            className="text-headline-md font-headline-md font-bold text-primary"
            href="/"
          >
            EduMastery
          </Link>
          <nav className="hidden md:flex gap-6">
            {navLinks.map((link, index) => (
              <a
                key={index}
                className={`font-body-md text-body-md transition-colors ${
                  index === 0
                    ? 'text-primary font-bold border-b-2 border-primary pb-1'
                    : 'text-secondary hover:text-primary'
                }`}
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="font-label-md text-label-md text-secondary hover:text-primary transition-colors">
            Login
          </Link>
          <Link href="/register" className="font-label-md text-label-md bg-primary text-on-primary px-6 py-2 rounded-lg shadow-sm hover:bg-primary-container transition-all">
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
