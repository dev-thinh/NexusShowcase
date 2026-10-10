import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Đang khởi tạo dữ liệu học thuật thực tế cho NexusShowcase...');

  // Mật khẩu mặc định cho các tài khoản
  const defaultPasswordHash = await bcrypt.hash('admin123456', 10);
  const memberPasswordHash = await bcrypt.hash('member123456', 10);

  // 1. Thầy Cố Vấn Học Thuật & Chủ Nhiệm (ADMIN)
  const advisorTriet = await prisma.user.upsert({
    where: { email: 'tranminhtriet@fit.hcmus.edu.vn' },
    update: {},
    create: {
      email: 'tranminhtriet@fit.hcmus.edu.vn',
      fullName: 'PGS.TS. Trần Minh Triết',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      bio: 'Phó Hiệu trưởng kiêm Trưởng Phòng thí nghiệm Công nghệ Phần mềm, Cố vấn Học thuật CLB Nexus, Khoa CNTT - ĐH Khoa học Tự nhiên ĐHQG-HCM.',
      googleScholarUrl: 'https://scholar.google.com/citations?user=real-triet-tmt',
      portfolioUrl: 'https://www.fit.hcmus.edu.vn/~tmtriet/',
    },
  });

  const advisorTho = await prisma.user.upsert({
    where: { email: 'quanthanhtho@fit.hcmus.edu.vn' },
    update: {},
    create: {
      email: 'quanthanhtho@fit.hcmus.edu.vn',
      fullName: 'PGS.TS. Quản Thành Thơ',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      bio: 'Giảng viên Cao cấp Bộ môn Khoa học Máy tính, Giám đốc PTN Trí tuệ Nhân tạo AILab, ĐH KHTN.',
      googleScholarUrl: 'https://scholar.google.com/citations?user=tho-qt',
      portfolioUrl: 'https://www.fit.hcmus.edu.vn/~qttho/',
    },
  });

  // Alias đăng nhập nhanh cho test
  await prisma.user.upsert({
    where: { email: 'advisor@hcmus.edu.vn' },
    update: {},
    create: {
      email: 'advisor@hcmus.edu.vn',
      fullName: 'PGS.TS. Trần Minh Triết (Admin)',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      bio: 'Tài khoản quản trị Thầy chủ nhiệm CLB Nexus.',
    },
  });

  // 2. Thành viên nòng cốt (CORE_MEMBER)
  const studentLong = await prisma.user.upsert({
    where: { email: '21120001@student.hcmus.edu.vn' },
    update: {},
    create: {
      email: '21120001@student.hcmus.edu.vn',
      fullName: 'Nguyễn Hoàng Long',
      studentId: '21120001',
      passwordHash: memberPasswordHash,
      role: 'CORE_MEMBER',
      status: 'ACTIVE',
      bio: 'Sinh viên Khóa 2021 Lớp Cử nhân Tài năng CNTT. Trưởng ban Học thuật CLB Nexus, Nghiên cứu viên sinh viên mảng Thị giác máy tính (Computer Vision) & AI Y tế.',
      githubUrl: 'https://github.com/hoanglong-ai',
      googleScholarUrl: 'https://scholar.google.com/citations?user=long-nh-hcmus',
      linkedinUrl: 'https://www.linkedin.com/in/hoanglong-hcmus',
    },
  });

  const studentKhoi = await prisma.user.upsert({
    where: { email: '22120088@student.hcmus.edu.vn' },
    update: {},
    create: {
      email: '22120088@student.hcmus.edu.vn',
      fullName: 'Đặng Minh Khôi',
      studentId: '22120088',
      passwordHash: memberPasswordHash,
      role: 'CORE_MEMBER',
      status: 'ACTIVE',
      bio: 'Sinh viên Khóa 2022 mảng Khoa học Dữ liệu. Lead Kỹ thuật CLB Nexus, Nghiên cứu viên sinh viên mảng Xử lý ngôn ngữ tự nhiên tiếng Việt (Vietnamese NLP) & Edge Computing.',
      githubUrl: 'https://github.com/khoi-dang-nexus',
      linkedinUrl: 'https://www.linkedin.com/in/minhkhoi-dang',
    },
  });

  // 3. Thành viên thông thường (MEMBER)
  const studentThao = await prisma.user.upsert({
    where: { email: '23120150@student.hcmus.edu.vn' },
    update: {},
    create: {
      email: '23120150@student.hcmus.edu.vn',
      fullName: 'Phạm Thu Thảo',
      studentId: '23120150',
      passwordHash: memberPasswordHash,
      role: 'MEMBER',
      status: 'ACTIVE',
      bio: 'Sinh viên Khóa 2023 Khoa CNTT. Thành viên Ban Kỹ thuật CLB Nexus, quan tâm mảng Fullstack Web Development & UI/UX Design.',
      githubUrl: 'https://github.com/thuthao-dev',
    },
  });

  const studentTuan = await prisma.user.upsert({
    where: { email: '23120220@student.hcmus.edu.vn' },
    update: {},
    create: {
      email: '23120220@student.hcmus.edu.vn',
      fullName: 'Vũ Anh Tuấn',
      studentId: '23120220',
      passwordHash: memberPasswordHash,
      role: 'MEMBER',
      status: 'ACTIVE',
      bio: 'Sinh viên Khóa 2023 Khoa CNTT. Thành viên Ban Học thuật CLB Nexus, Đội tuyển Olympic Tin học Sinh viên & ICPC HCMUS.',
      githubUrl: 'https://github.com/tuan-va-coder',
    },
  });

  const studentLinh = await prisma.user.upsert({
    where: { email: '24120305@student.hcmus.edu.vn' },
    update: {},
    create: {
      email: '24120305@student.hcmus.edu.vn',
      fullName: 'Bùi Khánh Linh',
      studentId: '24120305',
      passwordHash: memberPasswordHash,
      role: 'MEMBER',
      status: 'ACTIVE',
      bio: 'Tân sinh viên Khóa 2024 Khoa CNTT. Thành viên mới gia nhập CLB Nexus, đang tham gia đề tài học tập nội bộ.',
    },
  });

  // 4. Các công trình học thuật & sản phẩm thực tế
  // Công trình 1: Bài báo Y tế AI
  await prisma.showcaseItem.upsert({
    where: { slug: 'vimed-seg-transformer-cnn-brain-tumor-mri' },
    update: {},
    create: {
      title: 'ViMed-Seg: Mô Hình Lai Transformer-CNN Trong Phân Đoạn Tự Động Khối U Não Trên Ảnh MRI Đa Chuỗi',
      slug: 'vimed-seg-transformer-cnn-brain-tumor-mri',
      summary: 'Nghiên cứu kiến trúc mạng lai sâu kết hợp Swin Transformer và Residual CNN nhằm tự động phân đoạn các vùng khối u não (Edema, Enhancing Tumor, Necrotic Core) trên tập dữ liệu ảnh MRI BraTS với chỉ số Dice Score trung bình đạt 91.8%.',
      content: `## 1. Giới thiệu Đề tài
Khối u não là một trong những dạng bệnh lý ác tính đòi hỏi sự chuẩn xác cao trong chẩn đoán hình ảnh. Việc bóc tách thủ công vùng u trên ảnh MRI tốn nhiều giờ làm việc của bác sĩ chẩn đoán hình ảnh và có độ biến thiên giữa các chuyên gia.

## 2. Đóng góp Khoa học Chính
* Đề xuất khối trích xuất đặc trưng đa tầng **Multi-scale Cross-Attention** giải quyết sự suy giảm thông tin không gian khi phân tích ảnh 3D.
* Giảm 35% số lượng tham số tính toán so với các mô hình 3D U-Net kinh điển, cho phép chạy thử nghiệm trên phần cứng máy trạm phòng lab.
* Thử nghiệm mù (blind test) với sự tham vấn y khoa từ các bác sĩ khoa Chẩn đoán hình ảnh Bệnh viện Chợ Rẫy.

## 3. Kết quả Thử nghiệm
Mô hình đạt độ chính xác Dice Similarity Coefficient lần lượt là:
- Whole Tumor (WT): 92.4%
- Tumor Core (TC): 89.6%
- Enhancing Tumor (ET): 87.2%`,
      type: 'RESEARCH_PAPER',
      scope: 'EXTERNAL',
      issuer: 'Hội nghị Quốc tế KSE 2026 & IEEE Access',
      status: 'PUBLISHED',
      publishedYear: 2026,
      publishedAt: new Date('2026-03-20'),
      creatorId: studentLong.id,
      contributors: {
        create: [
          {
            userId: advisorTriet.id,
            role: 'ADVISOR',
            displayOrder: 1,
          },
          {
            externalName: 'BS.CKII Nguyễn Thị Mai Hương',
            externalAffiliation: 'Trung tâm Y học Hạt nhân & Ung bướu - Bệnh viện Chợ Rẫy',
            role: 'ADVISOR',
            displayOrder: 2,
          },
          {
            userId: studentLong.id,
            role: 'FIRST_AUTHOR',
            displayOrder: 3,
          },
          {
            userId: studentThao.id,
            role: 'CO_AUTHOR',
            displayOrder: 4,
          },
          {
            externalName: 'TS. Bùi Huy Khang',
            externalAffiliation: 'Viện Nghiên cứu Dữ liệu lớn VinBigdata',
            externalLink: 'https://scholar.google.com',
            role: 'CORRESPONDING_AUTHOR',
            displayOrder: 5,
          },
        ],
      },
      links: {
        create: [
          {
            label: 'Bài báo bản thảo arXiv (2403.01829)',
            url: 'https://arxiv.org/abs/2403.01829',
            type: 'PAPER_URL',
          },
          {
            label: 'Mã nguồn mở PyTorch trên GitHub',
            url: 'https://github.com/nexus-lab/vimed-seg',
            type: 'GITHUB',
          },
          {
            label: 'Video Demo Thuyết Trình Hội Nghị',
            url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
            type: 'VIDEO_EMBED',
          },
          {
            label: 'Web Thử Nghiệm Trực Quan (Live Demo)',
            url: 'https://vimed-seg-demo.hcmus.edu.vn',
            type: 'LIVE_DEMO',
          },
        ],
      },
    },
  });

  // Công trình 2: Bài báo NLP tiếng Việt
  await prisma.showcaseItem.upsert({
    where: { slug: 'phollm-legal-vietnamese-llm-retrieval' },
    update: {},
    create: {
      title: 'PhoLLM-Legal: Tinh Chỉnh Mô Hình Ngôn Ngữ Lớn Cho Bài Toán Truy Xuất & Tư Vấn Văn Bản Pháp Luật Việt Nam',
      slug: 'phollm-legal-vietnamese-llm-retrieval',
      summary: 'Xây dựng bộ dữ liệu benchmark hỏi đáp pháp luật Việt Nam gồm 50,000 điều luật và tinh chỉnh mô hình mã nguồn mở kết hợp kiến trúc RAG (Retrieval-Augmented Generation) đạt điểm F1 84.6% trong trích xuất điều khoản liên quan.',
      content: `## 1. Bối cảnh Nghiên cứu
Hệ thống văn bản quy phạm pháp luật Việt Nam có khối lượng đồ sộ và tính liên kết chéo phức tạp. Việc tra cứu thủ công gây nhiều khó khăn cho người dân và doanh nghiệp.

## 2. Giải pháp Kỹ thuật
* Xây dựng pipeline xử lý dữ liệu PDF từ Cổng Thông tin điện tử Chính phủ, tách đoạn ngữ nghĩa bảo toàn cấu trúc Điều - Khoản - Điểm.
* Ứng dụng mô hình nhúng tiếng Việt chuyên sâu kết hợp Hybrid Search (Dense Vector + BM25).
* Fine-tune mô hình LLaMA-3 và Qwen-2 trên tập chỉ dẫn pháp lý bằng kỹ thuật LoRA.`,
      type: 'RESEARCH_PAPER',
      scope: 'EXTERNAL',
      issuer: 'Hội nghị Quốc tế Xử lý Ngôn ngữ Tự nhiên & Đa ngữ RIVF 2026',
      status: 'PUBLISHED',
      publishedYear: 2026,
      publishedAt: new Date('2026-04-10'),
      creatorId: studentKhoi.id,
      contributors: {
        create: [
          {
            userId: advisorTho.id,
            role: 'ADVISOR',
            displayOrder: 1,
          },
          {
            userId: studentKhoi.id,
            role: 'FIRST_AUTHOR',
            displayOrder: 2,
          },
          {
            userId: studentTuan.id,
            role: 'CO_AUTHOR',
            displayOrder: 3,
          },
        ],
      },
      links: {
        create: [
          {
            label: 'Đọc Pre-print trên arXiv',
            url: 'https://arxiv.org/abs/2402.18950',
            type: 'PAPER_URL',
          },
          {
            label: 'Mã nguồn PhoLLM-Legal trên GitHub',
            url: 'https://github.com/nexus-lab/phollm-legal',
            type: 'GITHUB',
          },
          {
            label: 'Video Demo Thử Nghiệm Hỏi Đáp',
            url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
            type: 'VIDEO_EMBED',
          },
        ],
      },
    },
  });

  // Công trình 3: Dự án công nghệ SmartLab
  await prisma.showcaseItem.upsert({
    where: { slug: 'smartlab-nexus-edge-ai-face-attendance' },
    update: {},
    create: {
      title: 'SmartLab Nexus: Hệ Thống Điểm Danh & Giám Sát Phòng Nghiên Cứu Tự Động Bằng Nhận Diện Khuôn Mặt Edge AI',
      slug: 'smartlab-nexus-edge-ai-face-attendance',
      summary: 'Hệ thống IoT tích hợp camera nhúng Jetson Nano triển khai tại phòng lab CLB Nexus. Tự động nhận diện khuôn mặt thành viên ra vào phòng lab với độ trễ dưới 200ms, đồng bộ dữ liệu thời gian thực lên Dashboard quản lý.',
      content: `## Giới thiệu Sản phẩm
Hệ thống giải quyết bài toán quản lý trang thiết bị máy chủ GPU và thời gian hoạt động của các nhóm nghiên cứu trong phòng lab.

## Công nghệ sử dụng
- Edge Device: NVIDIA Jetson Nano, camera góc rộng Sony IMX219
- Computer Vision: RetinaFace phát hiện khuôn mặt + ArcFace trích xuất vector đặc trưng
- Backend: Next.js API Routes, Prisma ORM, PostgreSQL trên Docker
- Frontend: Tailwind CSS, shadcn/ui dashboard thời gian thực`,
      type: 'PROJECT',
      scope: 'CLUB_CONTRIBUTION',
      issuer: 'Ban Chủ Nhiệm & Phòng Thí Nghiệm Khoa CNTT - ĐH KHTN',
      status: 'PUBLISHED',
      publishedYear: 2025,
      publishedAt: new Date('2025-11-15'),
      creatorId: studentLong.id,
      contributors: {
        create: [
          {
            userId: studentLong.id,
            role: 'PROJECT_LEAD',
            displayOrder: 1,
          },
          {
            userId: studentKhoi.id,
            role: 'CONTRIBUTOR',
            customRoleTitle: 'Edge AI & IoT Backend',
            displayOrder: 2,
          },
          {
            userId: studentThao.id,
            role: 'CONTRIBUTOR',
            customRoleTitle: 'Web Dashboard & Realtime UI',
            displayOrder: 3,
          },
        ],
      },
      links: {
        create: [
          {
            label: 'Mã nguồn Dự án GitHub',
            url: 'https://github.com/nexus-club/smartlab-edge-ai',
            type: 'GITHUB',
          },
          {
            label: 'Video Vận Hành Trực Tiếp Tại Phòng Lab',
            url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
            type: 'VIDEO_EMBED',
          },
        ],
      },
    },
  });

  // Công trình 4: Giải thưởng NCKH Cấp Trường
  await prisma.showcaseItem.upsert({
    where: { slug: 'giai-nhat-sinh-vien-nckh-hcmus-2026' },
    update: {},
    create: {
      title: 'Giải Nhất Giải Thưởng Sinh Viên Nghiên Cứu Khoa Học Cấp Trường Năm 2026 — Lĩnh Vực CNTT',
      slug: 'giai-nhat-sinh-vien-nckh-hcmus-2026',
      summary: 'Đề tài phân đoạn ảnh y tế ứng dụng kiến trúc lai Deep Learning đạt giải Nhất chung cuộc Giải thưởng NCKH Sinh viên Trường ĐH Khoa học Tự nhiên - ĐHQG-HCM năm học 2025 - 2026.',
      type: 'ACHIEVEMENT',
      scope: 'EXTERNAL',
      issuer: 'Trường Đại Học Khoa Học Tự Nhiên - ĐHQG-HCM',
      status: 'PUBLISHED',
      publishedYear: 2026,
      publishedAt: new Date('2026-05-19'),
      creatorId: studentLong.id,
      contributors: {
        create: [
          {
            userId: advisorTriet.id,
            role: 'ADVISOR',
            displayOrder: 1,
          },
          {
            userId: studentLong.id,
            role: 'FIRST_AUTHOR',
            displayOrder: 2,
          },
          {
            userId: studentThao.id,
            role: 'CO_AUTHOR',
            displayOrder: 3,
          },
        ],
      },
      links: {
        create: [
          {
            label: 'Thông báo vinh danh từ Khoa CNTT',
            url: 'https://fit.hcmus.edu.vn/vn/default.aspx?tabid=468',
            type: 'CERTIFICATE',
          },
        ],
      },
    },
  });

  // Công trình 5: Cống hiến xây dựng cơ sở hạ tầng CLB
  await prisma.showcaseItem.upsert({
    where: { slug: 'xay-dung-cum-gpu-server-va-web-nexusshowcase' },
    update: {},
    create: {
      title: 'Đóng Góp Xây Dựng Cụm Máy Chủ GPU & Cổng Thông Tin Trưng Bày NexusShowcase',
      slug: 'xay-dung-cum-gpu-server-va-web-nexusshowcase',
      summary: 'Dự án cống hiến nội bộ: Thiết lập cụm server 4x RTX 4090 phục vụ huấn luyện mô hình cho các nhóm đề tài, và xây dựng nền tảng web NexusShowcase cho câu lạc bộ học thuật.',
      type: 'ACHIEVEMENT',
      scope: 'CLUB_CONTRIBUTION',
      issuer: 'Tập Thể Ban Kỹ Thuật CLB Nexus',
      status: 'PUBLISHED',
      publishedYear: 2025,
      publishedAt: new Date('2025-12-30'),
      creatorId: studentKhoi.id,
      contributors: {
        create: [
          {
            userId: studentKhoi.id,
            role: 'PROJECT_LEAD',
            displayOrder: 1,
          },
          {
            userId: studentTuan.id,
            role: 'CONTRIBUTOR',
            displayOrder: 2,
          },
          {
            userId: studentLinh.id,
            role: 'CONTRIBUTOR',
            displayOrder: 3,
          },
        ],
      },
      links: {
        create: [
          {
            label: 'Kho tài liệu cấu hình hạ tầng CLB',
            url: 'https://github.com/nexus-club/nexus-cluster-infra',
            type: 'GITHUB',
          },
        ],
      },
    },
  });

  // Công trình 6: Giải thưởng ICPC
  await prisma.showcaseItem.upsert({
    where: { slug: 'giai-nhi-icpc-asia-pacific-regional-2025' },
    update: {},
    create: {
      title: 'Giải Nhì Kỳ Thi Lập Trình Sinh Viên Quốc Tế ICPC Khu Vực Châu Á — Điểm Thi TP.HCM',
      slug: 'giai-nhi-icpc-asia-pacific-regional-2025',
      summary: 'Đội tuyển đại diện CLB Nexus và ĐH KHTN đạt Giải Nhì (Rank 4 toàn cuộc) tại vòng loại Khu vực Châu Á ICPC Asia Ho Chi Minh City Regional Contest 2025.',
      type: 'ACHIEVEMENT',
      scope: 'EXTERNAL',
      issuer: 'Hiệp Hội ICPC Quốc Tế & Hội Tin Học Việt Nam (VAIP)',
      status: 'PUBLISHED',
      publishedYear: 2025,
      publishedAt: new Date('2025-12-10'),
      creatorId: studentKhoi.id,
      contributors: {
        create: [
          {
            externalName: 'TS. Đinh Bá Tiến',
            externalAffiliation: 'Trưởng Khoa CNTT - ĐH Khoa Học Tự Nhiên',
            role: 'ADVISOR',
            displayOrder: 1,
          },
          {
            userId: studentTuan.id,
            role: 'FIRST_AUTHOR',
            displayOrder: 2,
          },
          {
            userId: studentKhoi.id,
            role: 'CO_AUTHOR',
            displayOrder: 3,
          },
        ],
      },
      links: {
        create: [
          {
            label: 'Bảng xếp hạng chung cuộc ICPC Global',
            url: 'https://icpc.global/regionals/finder/Vietnam-National-2025',
            type: 'CERTIFICATE',
          },
        ],
      },
    },
  });

  console.log('✅ Đã nạp thành công bộ dữ liệu học thuật thực tế cho NexusShowcase!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
