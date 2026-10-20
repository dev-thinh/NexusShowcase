import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async tx => {
    const research = await tx.category.upsert({
      where: { slug: 'bai-bao-khoa-hoc' },
      create: { slug: 'bai-bao-khoa-hoc', name: 'Nghiên cứu khoa học', layoutType: 'BIBLIOGRAPHY', isNavFeatured: true, displayOrder: 1 },
      update: { name: 'Nghiên cứu khoa học', layoutType: 'BIBLIOGRAPHY', isNavFeatured: true, displayOrder: 1 },
    });
    const robotics = await tx.category.upsert({
      where: { slug: 'robotics-iot' },
      create: { slug: 'robotics-iot', name: 'Robotics & IoT', layoutType: 'SHOWCASE_GRID', isNavFeatured: true, displayOrder: 2 },
      update: { name: 'Robotics & IoT', layoutType: 'SHOWCASE_GRID', isNavFeatured: true, displayOrder: 2 },
    });
    await tx.category.updateMany({ where: { id: { notIn: [research.id, robotics.id] } }, data: { isNavFeatured: false } });
    // Preserve all records and immutable submission history. Categories determine the publication type.
    const items = await tx.showcaseItem.findMany({ select: { id: true, type: true, categoryId: true } });
    for (const item of items) {
      const isResearch = item.categoryId === research.id || (item.categoryId !== robotics.id && item.type !== 'PROJECT');
      await tx.showcaseItem.update({
        where: { id: item.id },
        data: { type: isResearch ? 'RESEARCH_PAPER' : 'PROJECT', categoryId: isResearch ? research.id : robotics.id },
      });
    }
    console.log(`Đã phân loại ${items.length} bài vào Nghiên cứu khoa học và Robotics & IoT. Không xóa bài hoặc lịch sử.`);
  }, { timeout: 30000 });
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
