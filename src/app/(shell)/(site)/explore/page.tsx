import { redirect } from 'next/navigation';

/** Keep saved links working after retiring the all-publications page. */
export default async function ExplorePage({ searchParams }: {
  searchParams: Promise<{ q?: string; page?: string; year?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ['q', 'year', 'sort', 'page'] as const) {
    if (params[key]) query.set(key, params[key]);
  }
  redirect('/category/bai-bao-khoa-hoc' + (query.size ? '?' + query : ''));
}
