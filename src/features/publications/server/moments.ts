import 'server-only';
import { prisma } from '@/server/db/prisma';
import { Prisma } from '@prisma/client';
import { defaultMoments, momentsSaveSchema, type MomentsGallery } from '../model/moments';

type GalleryDatabase = Pick<typeof prisma, 'homeMomentsGallery'>;

export async function readMoments(galleryId = 'home', defaults = defaultMoments, database: GalleryDatabase = prisma): Promise<MomentsGallery> {
  const gallery = await database.homeMomentsGallery.findUnique({ where: { id: galleryId } });
  return gallery ? momentsSaveSchema.parse(gallery) : { version: 0, photos: defaults };
}

/** Compare and increment the version atomically; the first save also races safely. */
export async function saveMoments(gallery: MomentsGallery, galleryId = 'home', database: GalleryDatabase = prisma): Promise<MomentsGallery | null> {
  const changed = await database.homeMomentsGallery.updateMany({
    where: { id: galleryId, version: gallery.version },
    data: { photos: gallery.photos, version: { increment: 1 } },
  });
  if (changed.count) return { photos: gallery.photos, version: gallery.version + 1 };
  if (gallery.version !== 0) return null;
  try {
    await database.homeMomentsGallery.create({ data: { id: galleryId, photos: gallery.photos, version: 1 } });
    return { photos: gallery.photos, version: 1 };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return null;
    throw error;
  }
}
