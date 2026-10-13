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

  // 3. Dự án & Sáng tạo
  const catCreative = await prisma.category.upsert({
    where: { slug: 'du-an-sang-tao' },
    update: { isNavFeatured: true, displayOrder: 3, layoutType: 'SHOWCASE_GRID' },
    create: {
      name: 'Dự án & Sáng tạo',
      slug: 'du-an-sang-tao',
      description: 'Các sản phẩm phần mềm, sáng kiến công nghệ ứng dụng và giải pháp sáng tạo của sinh viên.',
      layoutType: 'SHOWCASE_GRID',
      isNavFeatured: true,
      displayOrder: 3,
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
        data: { categoryId: catCreative.id, visibility: 'PUBLIC' },
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
