import { z } from 'zod';

export const MAX_MEMBER_CSV_BYTES = 128 * 1024;
export const MAX_MEMBER_IMPORT_ROWS = 100;
export const bulkMemberCsvSchema = z.object({ csv: z.string().max(MAX_MEMBER_CSV_BYTES) }).strict();
export type BulkMemberRow = { line: number; fullName: string; email: string; studentId: string; errors: string[] };
export type BulkMemberResult = BulkMemberRow & { status: 'CREATED' | 'SKIPPED' | 'FAILED'; message: string; userId?: string; temporaryPassword?: string };

export function memberLoginKey(value: string): string {
  return value.trim().toLowerCase().replace(/@(robotics|nexus)\.hcmus\.edu\.vn$/, '');
}
