import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import { defaultHomeText, homeContentSchema, normalizeHomeText, type HomeContent } from '../model/home-content';

type ContentDatabase = Pick<typeof prisma, 'homePageContent'>;
export async function readHomeContent(database: ContentDatabase = prisma): Promise<HomeContent> {
  const content = await database.homePageContent.findUnique({ where: { id: 'home' } });
  return content ? homeContentSchema.parse({ version: content.version, text: normalizeHomeText(content.text) }) : { version: 0, text: defaultHomeText };
}

export async function saveHomeContent(content: HomeContent, database: ContentDatabase = prisma): Promise<HomeContent | null> {
  const changed = await database.homePageContent.updateMany({
    where: { id: 'home', version: content.version },
    data: { text: content.text, version: { increment: 1 } },
  });
  const saved = { text: content.text, version: content.version + 1 };
  if (changed.count) return saved;
  if (content.version !== 0) return null;
  try {
    await database.homePageContent.create({ data: { id: 'home', ...saved } });
    return saved;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return null;
    throw error;
  }
}
