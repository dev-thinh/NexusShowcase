import { NavigationLink as Link } from '@/shared/navigation/navigation-link';

const sections = [
  { href: '/explore', label: 'Tất cả công trình' },
  { href: '/category/bai-bao-khoa-hoc', label: 'Nghiên cứu khoa học' },
  { href: '/category/robotics-iot', label: 'Robotics & IoT' },
];

export function PublicationNavigation({ currentHref }: { currentHref: string }) {
  return (
    <nav aria-label="Chuyên mục công trình" className="mt-6 flex gap-6 overflow-x-auto border-b border-slate-200">
      {sections.map(section => {
        const active = section.href === currentHref;
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap border-b-2 px-1 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#153D67] ${active ? 'border-[#153D67] text-[#153D67]' : 'border-transparent text-foreground-muted hover:border-slate-300 hover:text-[#153D67]'}`}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
