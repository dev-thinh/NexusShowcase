export type Page<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number };

export function pageBounds(rawPage: unknown, total: number, pageSize: number) {
  if (!Number.isSafeInteger(total) || total < 0 || !Number.isSafeInteger(pageSize) || pageSize < 1) throw new RangeError('Invalid pagination bounds');
  const requested = typeof rawPage === 'number' ? rawPage : typeof rawPage === 'string' && /^\d+$/.test(rawPage.trim()) ? Number(rawPage) : NaN;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, totalPages) : 1;
  return { page, skip: (page - 1) * pageSize, take: pageSize, totalPages };
}
