import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Đang kiểm tra và khởi tạo dữ liệu bootstrap cho NexusShowcase...');

  if (process.env.RESET_DATABASE === 'true') {
    console.log('⚠️ Cờ RESET_DATABASE được bật: Đang làm sạch dữ liệu cũ...');
    await prisma.itemAttachment.deleteMany();
    await prisma.itemLink.deleteMany();
    await prisma.itemContributor.deleteMany();
    await prisma.showcaseItem.deleteMany();
    await prisma.user.deleteMany();
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log(`ℹ️ Tài khoản Quản trị viên đã tồn tại (${existingAdmin.email}). Bỏ qua khởi tạo admin mới.`);
    return;
  }

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim() || 'admin01';
  const rawPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim();

  if (!rawPassword) {
    throw new Error(
      'Vui lòng cấu hình biến môi trường BOOTSTRAP_ADMIN_PASSWORD để tạo tài khoản admin đầu tiên.'
    );
  }

  const adminPasswordHash = await bcrypt.hash(rawPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email,
      fullName: 'Quản Trị Viên Học Thuật (Admin)',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      mustChangePassword: false,
      sessionVersion: 1,
      bio: 'Tài khoản Quản trị viên CLB Nexus, Khoa CNTT - ĐH KHTN ĐHQG-HCM.',
    },
  });

  console.log(`✅ Khởi tạo thành công tài khoản quản trị: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
