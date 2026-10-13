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
        <header className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex items-start gap-3 sm:gap-3.5">
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-[#0F294A] shrink-0 mt-0.5 sm:mt-1" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Nhân sự &amp; Nghiên cứu viên
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                Danh bạ Thành viên Robotics &amp; IoT Lab
              </h1>
              <p className="text-sm text-slate-600 truncate max-w-3xl mt-1">
                Mạng lưới sinh viên, nghiên cứu viên và giảng viên phụ trách các hoạt động nghiên cứu khoa học, chuyển giao công nghệ tại Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM.
              </p>
              <div className="mt-2.5 flex items-center gap-4 text-xs font-semibold text-slate-500 flex-wrap">
                <span>Tổng cộng: {members.length} thành viên</span>
                <span>•</span>
                <span>{advisors.length} Giảng viên &amp; Cố vấn</span>
                <span>•</span>
                <span>{coreMembers.length} Thành viên nòng cốt</span>
                <span>•</span>
                <span>{regularMembers.length} Nghiên cứu viên</span>
              </div>
            </div>
          </div>
        </header>

        {/* 1. Advisors & Faculty (ADMIN) */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-6 h-6 text-purple-600 shrink-0" />
            <h2 className="text-xl font-bold text-slate-900">
              Ban Cố Vấn &amp; Giảng Viên Phụ Trách
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
              {advisors.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {advisors.map((advisor) => (
              <div
                key={advisor.id}
                className="p-4 sm:p-5 rounded-lg bg-white border border-purple-100 shadow-2xs hover:border-purple-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-base shrink-0 shadow-2xs">
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
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                      {advisor.bio}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{advisor._count.contributions} công trình</span>
                  </div>
                  <Link
                    href={`/members/${advisor.id}`}
                    className="font-bold text-purple-700 hover:underline inline-flex items-center gap-1"
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
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
            <h2 className="text-xl font-bold text-slate-900">
              Ban Chủ Nhiệm &amp; Thành Viên Nòng Cốt
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {coreMembers.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreMembers.map((member) => (
              <div
                key={member.id}
                className="p-4 sm:p-5 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-12 h-12 rounded-full bg-[#2B4C6F] text-white font-bold flex items-center justify-center text-base shrink-0 shadow-2xs">
                      {member.fullName?.charAt(0) || 'C'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/members/${member.id}`}
                        className="font-bold text-base text-slate-900 hover:text-[#2B4C6F] transition-colors truncate block"
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
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
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
                    <span className="text-slate-500 font-medium">
                      {member._count.contributions} đề tài
                    </span>
                  </div>

                  <Link
                    href={`/members/${member.id}`}
                    className="font-bold text-[#0F294A] hover:underline inline-flex items-center gap-1"
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
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <h2 className="text-xl font-bold text-slate-900">
              Thành Viên Nghiên Cứu &amp; Kỹ Thuật
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              {regularMembers.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularMembers.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
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
