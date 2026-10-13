import { prisma } from '../src/lib/prisma';

async function seedCategories() {
  console.log('Seeding categories and assigning published items...');

  // 1. Robotics & IoT
  const catRobotics = await prisma.category.upsert({
    where: { slug: 'robotics-iot' },
    update: { isNavFeatured: true, displayOrder: 1, layoutType: 'SHOWCASE_GRID' },
    create: {
      name: 'Robotics & IoT',
      slug: 'robotics-iot',
      description: 'Các dự án phần cứng, hệ thống robot tự hành, mạch nhúng và thiết bị IoT thông minh.',
      layoutType: 'SHOWCASE_GRID',
      isNavFeatured: true,
      displayOrder: 1,
    },
  });

  // 2. Bài báo Khoa học
  const catPapers = await prisma.category.upsert({
    where: { slug: 'bai-bao-khoa-hoc' },
    update: { isNavFeatured: true, displayOrder: 2, layoutType: 'BIBLIOGRAPHY' },
    create: {
      name: 'Bài báo Khoa học',
      slug: 'bai-bao-khoa-hoc',
      description: 'Các công trình nghiên cứu khoa học được công bố tại các hội thảo và tạp chí chuyên ngành.',
      layoutType: 'BIBLIOGRAPHY',
      isNavFeatured: true,
      displayOrder: 2,
    },
  });

  // 3. Tập dữ liệu & AI
  const catData = await prisma.category.upsert({
    where: { slug: 'tap-du-lieu-ai' },
    update: { isNavFeatured: true, displayOrder: 3, layoutType: 'DATA_CATALOG' },
    create: {
      name: 'Tập dữ liệu & AI',
      slug: 'tap-du-lieu-ai',
      description: 'Các bộ dữ liệu học thuật, pre-trained model và công cụ mã nguồn mở phục vụ cộng đồng.',
      layoutType: 'DATA_CATALOG',
      isNavFeatured: true,
      displayOrder: 3,
    },
  });

  // 4. Vinh danh & Giải thưởng
  const catAwards = await prisma.category.upsert({
    where: { slug: 'vinh-danh-giai-thuong' },
    update: { isNavFeatured: false, displayOrder: 4, layoutType: 'HONOR_ROLL' },
    create: {
      name: 'Giải thưởng & Thành tích',
      slug: 'vinh-danh-giai-thuong',
      description: 'Bảng vàng ghi nhận các giải thưởng nghiên cứu khoa học và cuộc thi công nghệ của thành viên CLB.',
      layoutType: 'HONOR_ROLL',
      isNavFeatured: false,
      displayOrder: 4,
    },
  });

  // Update existing items to be PUBLIC and assigned to categories
  const publishedItems = await prisma.showcaseItem.findMany({
    where: { status: 'PUBLISHED' },
  });

  if (publishedItems.length >= 2) {
    await prisma.showcaseItem.update({
      where: { id: publishedItems[0].id },
      data: { categoryId: catPapers.id, visibility: 'PUBLIC' },
    });
    await prisma.showcaseItem.update({
      where: { id: publishedItems[1].id },
      data: { categoryId: catRobotics.id, visibility: 'PUBLIC' },
    });
    if (publishedItems.length >= 3) {
      await prisma.showcaseItem.update({
        where: { id: publishedItems[2].id },
        data: { categoryId: catData.id, visibility: 'PUBLIC' },
      });
    }
    if (publishedItems.length >= 4) {
      await prisma.showcaseItem.update({
        where: { id: publishedItems[3].id },
        data: { categoryId: catPapers.id, visibility: 'PUBLIC' },
      });
    }
  }

  console.log('Done seeding categories and items!');
}

seedCategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
