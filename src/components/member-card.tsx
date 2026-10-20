import Link from 'next/link';
import { ArrowRight, FileText, Github, Linkedin } from 'lucide-react';
import {
  MEMBER_GROUP_LABELS,
  type MemberDirectoryEntry,
  type PublicMemberRole,
} from '@/lib/member-directory';

const tones: Record<PublicMemberRole, { avatar: string; label: string }> = {
  ADMIN: {
    avatar: 'bg-primary text-primary-foreground',
    label: 'border-navy-100 bg-primary-subtle text-primary',
  },
  CORE_MEMBER: {
    avatar: 'bg-navy-100 text-primary',
    label: 'border-navy-100 bg-primary-subtle text-primary',
  },
  MEMBER: {
    avatar: 'bg-slate-100 text-slate-600',
    label: 'border-slate-200 bg-slate-50 text-slate-600',
  },
};

export function MemberCard({
  member,
  group,
}: {
  member: MemberDirectoryEntry;
  group: PublicMemberRole;
}) {
  const tone = tones[group];
  const initials = member.fullName.trim().split(/\s+/).filter(Boolean)
    .slice(-2).map((part) => part.charAt(0)).join('').toLocaleUpperCase('vi');

  return (
    <article className="panel-public group flex h-full min-w-0 flex-col p-4 transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-md focus-within:border-border-strong motion-reduce:transition-none sm:p-5">
      <header className="flex items-start gap-4">
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.avatarUrl}
            alt=""
            width={56}
            height={56}
            loading="lazy"
            className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${tone.avatar}`}
          >
            {initials || 'RI'}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-foreground [overflow-wrap:anywhere]">
            <Link
              href={`/members/${member.id}`}
              className="rounded-sm transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {member.fullName}
            </Link>
          </h3>
          <p className={`mt-2 inline-flex max-w-full rounded-md border px-2 py-1 text-xs font-semibold leading-relaxed ${tone.label}`}>
            {MEMBER_GROUP_LABELS[group]}
          </p>
          {member.studentId && (
            <p className="mt-2 text-xs leading-relaxed text-foreground-muted [overflow-wrap:anywhere]">
              MSSV: <span className="font-sans">{member.studentId}</span>
            </p>
          )}
        </div>
      </header>

      {member.bio && (
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-foreground-secondary [overflow-wrap:anywhere]">
          {member.bio}
        </p>
      )}

      <div className="mt-auto pt-5">
        <div className="flex items-center gap-2.5 rounded-md bg-slate-50 px-3 py-2.5 text-sm text-foreground-secondary">
          <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-foreground-muted" />
          <span>
            <span className="font-semibold tabular-nums text-primary">{member._count.contributions}</span>
            {' '}công trình
          </span>
        </div>

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border-subtle pt-3">
          <Link
            href={`/members/${member.id}`}
            aria-label={`Xem hồ sơ của ${member.fullName}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-md text-xs font-semibold text-primary transition-colors hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Xem hồ sơ
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>

          {(member.githubUrl || member.linkedinUrl) && (
            <div className="flex items-center gap-1">
              {member.githubUrl && (
                <a
                  href={member.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`GitHub của ${member.fullName}`}
                  title={`GitHub của ${member.fullName}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-slate-100 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Github aria-hidden="true" className="h-4 w-4" />
                </a>
              )}
              {member.linkedinUrl && (
                <a
                  href={member.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`LinkedIn của ${member.fullName}`}
                  title={`LinkedIn của ${member.fullName}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-slate-100 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Linkedin aria-hidden="true" className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </footer>
      </div>
    </article>
  );
}
