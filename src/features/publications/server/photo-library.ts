import 'server-only';
import { prisma } from '@/server/db/prisma';
import { mergePhotoLibrary } from '../model/photo-library';
import { defaultResearchImages } from '../model/research-images';
import { defaultMoments, type MomentsGallery } from '../model/moments';
import { readMoments, saveMoments } from './moments';

type GalleryDatabase = Pick<typeof prisma, 'homeMomentsGallery'>;
class LibraryConflict extends Error {}
class PhotoInUse extends Error {}

export async function readSharedLibrary(database: GalleryDatabase = prisma) {
  const [home, research] = await Promise.all([
    readMoments('home', defaultMoments, database),
    readMoments('research', defaultResearchImages, database),
  ]);
  return { home: { ...home, photos: mergePhotoLibrary(home.photos, research.photos) }, research };
}

/** Both section edits serialize through the shared home-library version. */
export async function saveSharedGallery(gallery: MomentsGallery, section: 'home' | 'research', library?: MomentsGallery) {
  try {
    const saved = await prisma.$transaction(async database => {
      const current = await readSharedLibrary(database);
      if (section === 'home') {
        if (gallery.version !== current.home.version) throw new LibraryConflict();
        const sources = new Set(gallery.photos.map(photo => photo.src));
        if (current.research.photos.some(photo => !sources.has(photo.src))) throw new PhotoInUse();
        const result = await saveMoments(gallery, 'home', database);
        if (!result) throw new LibraryConflict();
        return result;
      }
      if (gallery.version !== current.research.version || (library && library.version !== current.home.version)) throw new LibraryConflict();
      // Older clients omit the library; register their selected assets as well.
      let home = library ?? { ...current.home, photos: mergePhotoLibrary(current.home.photos, gallery.photos) };
      const requestedSources = new Set(home.photos.map(photo => photo.src));
      if (gallery.photos.some(photo => !requestedSources.has(photo.src)) || current.home.photos.some(photo => photo.slot !== null && !requestedSources.has(photo.src))) throw new PhotoInUse();
      // Editing research cannot move or hide photos in the moments section.
      const bySource = new Map(current.home.photos.map(photo => [photo.src, photo]));
      home = { ...home, photos: home.photos.map(photo => bySource.get(photo.src) ?? { ...photo, slot: null, visible: false }) };
      if (home.photos.length > 40) throw new PhotoInUse('Thư viện tối đa 40 ảnh. Hãy gỡ ảnh chưa dùng trước khi tải thêm.');
      if (!await saveMoments(home, 'home', database)) throw new LibraryConflict();
      const result = await saveMoments(gallery, 'research', database);
      if (!result) throw new LibraryConflict();
      return result;
    });
    return { success: true as const, data: saved };
  } catch (error) {
    if (error instanceof LibraryConflict) return { success: false as const, code: 'CONFLICT' as const, error: 'Thư viện hoặc ảnh đã được Admin khác cập nhật. Hãy sao chép nội dung cần giữ và mở lại chỉnh sửa.' };
    if (error instanceof PhotoInUse) return { success: false as const, code: 'VALIDATION' as const, error: error.message || 'Không thể xóa ảnh đang được sử dụng ở mục khác.' };
    throw error;
  }
}
