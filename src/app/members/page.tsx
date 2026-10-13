import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { RoleBadge } from '@/components/ui/badge';
import { publicUserSelect } from '@/lib/public-user';
import {
  Users,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Github,
  Linkedin,
  FileText,
  ArrowRight,
} from 'lucide-react';

export default async function MembersDirectoryPage() {
  const members = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: {
      ...publicUserSelect,
      studentId: true,
      _count: {
        select: {
          contributions: {
            where: { item: { status: 'PUBLISHED' } },
          },
        },
      },
    },
    orderBy: [{ fullName: 'asc' }],
  });

  const advisors = members.filter((m) => m.role === 'ADMIN');
  const coreMembers = members.filter((m) => m.role === 'CORE_MEMBER');
  const regularMembers = members.filter((m) => m.role === 'MEMBER');

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl flex-1">
        {/* Header */}
        <header className="mb-12 pb-8 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200/80">
              <Users className="w-6 h-6 text-[#0F294A]" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Nhân sự &amp; Nghiên cứu viên
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Danh bạ Thành viên CLB Nexus
              </h1>
            </div>
          </div>
          <p className="text-base text-slate-600 max-w-3xl leading-relaxed mt-2">
            Mạng lưới sinh viên, nghiên cứu viên và giảng viên phụ trách các hoạt động nghiên cứu khoa học,
            chuyển giao công nghệ và phát triển giải pháp thực tiễn tại Khoa Công nghệ Thông tin,
            Trường Đại học Khoa học Tự nhiên - ĐHQG-HCM.
          </p>
          <div className="mt-4 flex items-center gap-6 text-xs font-semibold text-slate-500">
            <span>Tổng cộng: {members.length} thành viên</span>
            <span>•</span>
            <span>{advisors.length} Giảng viên &amp; Cố vấn</span>
            <span>•</span>
            <span>{coreMembers.length} Thành viên nòng cốt</span>
            <span>•</span>
            <span>{regularMembers.length} Nghiên cứu viên</span>
          </div>
        </header>

        {/* 1. Advisors & Faculty (ADMIN) */}
        <section className="mb-14">
          <div className="flex items-center gap-2.5 mb-6">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Ban Cố Vấn &amp; Giảng Viên Phụ Trách
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {advisors.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advisors.map((advisor) => (
              <div
                key={advisor.id}
                className="p-6 rounded-2xl bg-white border border-purple-100 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-lg shrink-0 shadow-xs">
                      {advisor.fullName?.charAt(0) || 'A'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/members/${advisor.id}`}
                        className="font-bold text-base text-slate-900 hover:text-purple-700 transition-colors truncate block"
                      >
                        {advisor.fullName}
                      </Link>
                      <div className="mt-1">
                        <RoleBadge role={advisor.role} />
                      </div>
                    </div>
                  </div>

                  {advisor.bio && (
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                      {advisor.bio}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{advisor._count.contributions} công trình</span>
                  </div>
                  <Link
                    href={`/members/${advisor.id}`}
                    className="text-xs font-bold text-purple-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Xem hồ sơ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Core Leadership & Members (CORE_MEMBER) */}
        <section className="mb-14">
          <div className="flex items-center gap-2.5 mb-6">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Ban Chủ Nhiệm &amp; Thành Viên Nòng Cốt
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {coreMembers.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreMembers.map((member) => (
              <div
                key={member.id}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-[#0F294A] text-white font-bold flex items-center justify-center text-lg shrink-0 shadow-xs">
                      {member.fullName?.charAt(0) || 'C'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/members/${member.id}`}
                        className="font-bold text-base text-slate-900 hover:text-[#0F294A] transition-colors truncate block"
                      >
                        {member.fullName}
                      </Link>
                      <div className="mt-1">
                        <RoleBadge role={member.role} />
                      </div>
                      {member.studentId && (
                        <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                          MSSV: {member.studentId}
                        </span>
                      )}
                    </div>
                  </div>

                  {member.bio && (
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                      {member.bio}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {member.githubUrl && (
                      <a
                        href={member.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded text-slate-400 hover:text-slate-800"
                      >
                        <Github className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {member.linkedinUrl && (
                      <a
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded text-slate-400 hover:text-blue-600"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <span className="text-xs text-slate-500 font-medium ml-1">
                      {member._count.contributions} đề tài
                    </span>
                  </div>

                  <Link
                    href={`/members/${member.id}`}
                    className="text-xs font-bold text-[#0F294A] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Xem hồ sơ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Research & Technical Members (MEMBER) */}
        <section className="mb-10">
          <div className="flex items-center gap-2.5 mb-6">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Thành Viên Nghiên Cứu &amp; Kỹ Thuật
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {regularMembers.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularMembers.map((member) => (
              <div
                key={member.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm shrink-0 border border-slate-200">
                      {member.fullName?.charAt(0) || 'M'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/members/${member.id}`}
                        className="font-bold text-sm text-slate-900 hover:text-[#0F294A] transition-colors truncate block"
                      >
                        {member.fullName}
                      </Link>
                      <div className="mt-1">
                        <RoleBadge role={member.role} />
                      </div>
                      {member.studentId && (
                        <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                          MSSV: {member.studentId}
                        </span>
                      )}
                    </div>
                  </div>

                  {member.bio && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                      {member.bio}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {member.githubUrl && (
                      <a
                        href={member.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-slate-800"
                      >
                        <Github className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {member.linkedinUrl && (
                      <a
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-blue-600"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <span className="text-slate-500 font-medium">
                      {member._count.contributions} đề tài
                    </span>
                  </div>

                  <Link
                    href={`/members/${member.id}`}
                    className="font-bold text-[#0F294A] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Chi tiết</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <AcademicFooter />
    </div>
  );
}
