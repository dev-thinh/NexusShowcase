import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Đang làm sạch và khởi tạo tài khoản quản trị duy nhất cho NexusShowcase...');

  // Xóa toàn bộ dữ liệu mock cũ
  await prisma.itemAttachment.deleteMany();
  await prisma.itemLink.deleteMany();
  await prisma.itemContributor.deleteMany();
  await prisma.itemTag.deleteMany();
  await prisma.showcaseItem.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  // Khởi tạo duy nhất 1 tài khoản Admin
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin01',
      fullName: 'Quản Trị Viên Học Thuật (Admin)',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      bio: 'Tài khoản Quản trị viên Phòng Lab Nghiên cứu Khoa học & CLB Nexus, Khoa CNTT - ĐH KHTN ĐHQG-HCM.',
    },
  });

  console.log(`✅ Khởi tạo thành công tài khoản quản trị duy nhất: ${admin.email} (Mật khẩu: admin123)`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
