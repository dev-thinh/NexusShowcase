import { MemberAvatar } from '@/shared/ui/member-avatar';
import {
MEMBER_GROUP_LABELS,
type MemberDirectoryEntry,
type PublicMemberRole,
} from '@/features/members/model/directory';
import { ArrowRight, FileText, Github, Linkedin } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';

const tones: Record<PublicMemberRole, { avatar: string; label: string }> = {
  ADMIN: {
    avatar: 'bg-primary text-primary-foreground',
    label: 'border-slate-200 bg-primary-subtle text-[#1F2937]',
  },
  CORE_MEMBER: {
    avatar: 'bg-[#FFFFFF] text-[#1F2937]',
    label: 'border-slate-200 bg-primary-subtle text-[#1F2937]',
  },
  MEMBER: {
    avatar: 'bg-[#FFFFFF] text-[#1F2937]',
    label: 'border-slate-200 bg-[#FFFFFF] text-[#1F2937]',
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

  return (
    <article className="panel-public group flex h-full min-w-0 flex-col p-4 transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-md focus-within:border-border-strong motion-reduce:transition-none sm:p-5">
      <header className="flex items-start gap-4">
        <MemberAvatar fullName={member.fullName}
            src={member.avatarUrl}
            alt=""
            width={56}
            height={56}
            loading="lazy"
            className="h-14 w-14 shrink-0 rounded-full border border-border object-cover text-xl"
          />

        <div className="min-w-0 flex-1">
          <h3 className="h-14 line-clamp-2 text-base font-semibold leading-7 text-foreground [overflow-wrap:anywhere]">
            <Link
              href={`/members/${member.id}`}
              className="rounded-sm transition-colors hover:text-[#1F2937] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {member.fullName}
            </Link>
          </h3>
          <p className={`mt-2 inline-flex max-w-full rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-4 ${tone.label}`}>
            {MEMBER_GROUP_LABELS[group]}
          </p>
        </div>
      </header>

      {member.bio && (
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-foreground-secondary [overflow-wrap:anywhere]">
          {member.bio}
        </p>
      )}

      <div className="mt-auto pt-5">
        <div className="flex items-center gap-2.5 rounded-md bg-[#FFFFFF] px-3 py-2.5 text-sm text-foreground-secondary">
          <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-foreground-muted" />
          <span>
            <span className="font-semibold tabular-nums text-[#1F2937]">{member._count.contributions}</span>
            {' '}công trình
          </span>
        </div>

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border-subtle pt-3">
          <Link
            href={`/members/${member.id}`}
            aria-label={`Xem hồ sơ của ${member.fullName}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-md text-xs font-semibold text-[#1F2937] transition-colors hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-[#FFFFFF] hover:text-[#1F2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-[#FFFFFF] hover:text-[#1F2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
