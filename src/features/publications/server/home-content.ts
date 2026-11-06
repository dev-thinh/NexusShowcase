import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import { defaultHomeText, defaultEnglishHomeText, homeContentSchema, normalizeHomeText, type HomeContent } from '../model/home-content';

type ContentDatabase = Pick<typeof prisma, 'homePageContent'>;
export async function readHomeContent(database: ContentDatabase = prisma): Promise<HomeContent> {
  const content = await database.homePageContent.findUnique({ where: { id: 'home' } });
  if (!content) return { version: 0, text: defaultHomeText, englishText: defaultEnglishHomeText };
  const stored = content.text as Record<string, unknown> | null;
  // Legacy rows contain the Vietnamese fields directly. Preserve them on upgrade.
  return homeContentSchema.parse({
    version: content.version,
    text: stored && 'vi' in stored ? stored.vi : normalizeHomeText(stored),
    englishText: stored && 'en' in stored ? stored.en : defaultEnglishHomeText,
  });
}

export async function saveHomeContent(content: HomeContent, database: ContentDatabase = prisma): Promise<HomeContent | null> {
  const changed = await database.homePageContent.updateMany({
    where: { id: 'home', version: content.version },
    data: { text: { vi: content.text, en: content.englishText }, version: { increment: 1 } },
  });
  const saved = { text: content.text, englishText: content.englishText, version: content.version + 1 };
  if (changed.count) return saved;
  if (content.version !== 0) return null;
  try {
    await database.homePageContent.create({ data: { id: 'home', version: saved.version, text: { vi: saved.text, en: saved.englishText } } });
    return saved;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return null;
    throw error;
  }
}
