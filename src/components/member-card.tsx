import Link from 'next/link';
import { ArrowRight, FileText, Github, Linkedin } from 'lucide-react';
import {
  MEMBER_GROUP_LABELS,
  type MemberDirectoryEntry,
  type PublicMemberRole,
} from '@/lib/member-directory';

const tones: Record<
  PublicMemberRole,
  { avatar: string; accent: string; border: string }
> = {
  ADMIN: {
    avatar: 'bg-purple-700 text-white',
    accent: 'text-purple-700',
    border: 'hover:border-purple-200',
  },
  CORE_MEMBER: {
    avatar: 'bg-[#0F294A] text-white',
    accent: 'text-[#0F294A]',
    border: 'hover:border-blue-200',
  },
  MEMBER: {
    avatar: 'bg-slate-100 text-slate-700 border border-slate-200',
    accent: 'text-emerald-700',
    border: 'hover:border-slate-300',
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
    <article
      className={`panel-public h-full p-4 sm:p-5 flex flex-col transition-colors ${tone.border}`}
    >
      <div className="flex items-start gap-3.5">
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.avatarUrl}
            alt=""
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            aria-hidden="true"
            className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shrink-0 ${tone.avatar}`}
          >
            {member.fullName.charAt(0)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <Link
            href={`/members/${member.id}`}
            className="font-bold text-base text-slate-900 hover:text-[#0F294A] line-clamp-2 focus-visible:outline-none focus-visible:underline"
          >
            {member.fullName}
          </Link>
          <p className={`mt-1 text-xs font-semibold ${tone.accent}`}>
            {MEMBER_GROUP_LABELS[group]}
          </p>
          {member.studentId && (
            <p className="mt-1 text-xs font-mono text-slate-500">
              MSSV: {member.studentId}
            </p>
          )}
        </div>
      </div>

      {member.bio && (
        <p className="mt-4 text-sm leading-relaxed text-slate-600 line-clamp-3">
          {member.bio}
        </p>
      )}

      <footer className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 min-w-0">
          <FileText aria-hidden="true" className="w-4 h-4 shrink-0 text-slate-400" />
          <span className="font-semibold whitespace-nowrap">
            {member._count.contributions} công trình
          </span>

          {member.githubUrl && (
            <a
              href={member.githubUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`GitHub của ${member.fullName}`}
              title={`GitHub của ${member.fullName}`}
              className="p-1 rounded text-slate-400 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]"
            >
              <Github aria-hidden="true" className="w-4 h-4" />
            </a>
          )}

          {member.linkedinUrl && (
            <a
              href={member.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`LinkedIn của ${member.fullName}`}
              title={`LinkedIn của ${member.fullName}`}
              className="p-1 rounded text-slate-400 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]"
            >
              <Linkedin aria-hidden="true" className="w-4 h-4" />
            </a>
          )}
        </div>

        <Link
          href={`/members/${member.id}`}
          className="inline-flex items-center gap-1 font-bold text-[#0F294A] hover:underline whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A] rounded"
        >
          Xem hồ sơ
          <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
        </Link>
      </footer>
    </article>
  );
}
