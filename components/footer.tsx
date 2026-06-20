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
    title: 'Product',
    links: [
      { label: 'Courses', href: '#' },
      { label: 'Pricing', href: '#' },
    ],
  },
  {
    title: 'Categories',
    links: [
      { label: 'Technology', href: '#' },
      { label: 'Business', href: '#' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="w-full rounded-t-xl bg-surface-container mt-xl">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-lg px-lg py-xl max-w-container-max mx-auto">
        {/* Brand Section */}
        <div className="col-span-2 md:col-span-4 lg:col-span-2 space-y-4">
          <div className="text-headline-md font-headline-md font-bold text-on-surface">
            EduMastery
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            © 2024 EduMastery. Empowering professional growth through expert-led
            education.
          </p>
        </div>

        {/* Footer Links Sections */}
        {footerSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="flex flex-col gap-2">
            <span className="font-label-md text-label-md text-primary font-semibold mb-2">
              {section.title}
            </span>
            {section.links.map((link, linkIndex) => (
              <a
                key={linkIndex}
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
