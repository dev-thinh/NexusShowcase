import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123456', 10);

  // 1. Thầy chủ nhiệm (Admin)
  const admin = await prisma.user.upsert({
    where: { email: 'advisor@hcmus.edu.vn' },
    update: {},
    create: {
      email: 'advisor@hcmus.edu.vn',
      fullName: 'TS. Nguyễn Văn Hướng Dẫn',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      bio: 'Thầy chủ nhiệm CLB Nexus - Giảng viên Khoa CNTT, ĐH KHTN.',
      portfolioUrl: 'https://fit.hcmus.edu.vn',
    },
  });

  // 2. Thành viên nòng cốt (Core Member)
  const coreMember = await prisma.user.upsert({
    where: { email: 'core.lead@student.hcmus.edu.vn' },
    update: {},
    create: {
      email: 'core.lead@student.hcmus.edu.vn',
      fullName: 'Lê Văn Trưởng Nhóm',
      studentId: '22120001',
      passwordHash,
      role: 'CORE_MEMBER',
      status: 'ACTIVE',
      bio: 'Trưởng ban Học thuật CLB Nexus, Nghiên cứu sinh viên mảng Computer Vision.',
      githubUrl: 'https://github.com',
    },
  });

  // 3. Thành viên thông thường (Member)
  const regularMember = await prisma.user.upsert({
    where: { email: 'member.student@student.hcmus.edu.vn' },
    update: {},
    create: {
      email: 'member.student@student.hcmus.edu.vn',
      fullName: 'Trần Thị Thành Viên',
      studentId: '23120002',
      passwordHash,
      role: 'MEMBER',
      status: 'ACTIVE',
      bio: 'Thành viên ban Kỹ thuật CLB Nexus khóa 2023.',
    },
  });

  // 4. Mẫu bài báo khoa học đã xuất bản
  const samplePaper = await prisma.showcaseItem.upsert({
    where: { slug: 'deep-learning-medical-imaging-nexus' },
    update: {},
    create: {
      title: 'Ứng Dụng Học Sâu Trong Phân Đoạn Ảnh Y Tế Đa Chiều',
      slug: 'deep-learning-medical-imaging-nexus',
      summary: 'Nghiên cứu ứng dụng mạng U-Net cải tiến kết hợp Transformer để phân đoạn tự động khối u trên ảnh MRI với độ chính xác Dice score đạt 0.92.',
      content: '## Giới thiệu\nNghiên cứu này đề xuất giải pháp...\n\n## Phương pháp\nSử dụng kiến trúc lai giữa CNN và Vision Transformer.',
      type: 'RESEARCH_PAPER',
      scope: 'EXTERNAL',
      issuer: 'Hội nghị Khoa học Công nghệ Trẻ 2026',
      status: 'PUBLISHED',
      publishedYear: 2026,
      publishedAt: new Date('2026-05-15'),
      creatorId: coreMember.id,
      contributors: {
        create: [
          {
            userId: admin.id,
            role: 'ADVISOR',
            displayOrder: 1,
          },
          {
            userId: coreMember.id,
            role: 'FIRST_AUTHOR',
            displayOrder: 2,
          },
          {
            userId: regularMember.id,
            role: 'CO_AUTHOR',
            displayOrder: 3,
          },
          {
            externalName: 'ThS. Hoàng Đức Minh',
            externalAffiliation: 'Bệnh viện Chợ Rẫy',
            role: 'ADVISOR',
            displayOrder: 4,
          },
        ],
      },
      links: {
        create: [
          {
            label: 'Đọc trên arXiv',
            url: 'https://arxiv.org/abs/sample',
            type: 'PAPER_URL',
          },
          {
            label: 'Mã nguồn GitHub',
            url: 'https://github.com/nexus-club/medical-imaging',
            type: 'GITHUB',
          },
          {
            label: 'Video Demo YouTube',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            type: 'VIDEO_EMBED',
          },
        ],
      },
    },
  });

  console.log('Seeded database successfully:', { admin: admin.email, samplePaper: samplePaper.title });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
