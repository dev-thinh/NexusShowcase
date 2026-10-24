export function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi');
}
export function literalSearchPattern(value: string): string {
  return `%${normalizeSearchText(value.trim()).replace(/[\\%_]/g, '\\$&')}%`;
}
