import { localizedMetadata } from '@/shared/i18n/metadata';
export const generateMetadata = localizedMetadata({ title: 'Nghiên cứu khoa học' });

import CategoryPage from '@/features/publications/components/category-page';

export const dynamic = 'force-dynamic';

export default function Page({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; year?: string; sort?: string }> }) {
  return CategoryPage({ params: Promise.resolve({ slug: 'bai-bao-khoa-hoc' }), searchParams });
}
