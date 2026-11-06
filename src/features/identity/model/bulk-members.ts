import { z } from 'zod';
import { cuidSchema } from '@/shared/lib/validation';

export const MAX_MEMBER_CSV_BYTES = 128 * 1024;
export const MAX_MEMBER_IMPORT_ROWS = 100;
export const MAX_MEMBER_GRANTS = 50;
export const bulkMemberCsvSchema = z.object({ csv: z.string().max(MAX_MEMBER_CSV_BYTES) }).strict();
export const memberGrantSearchSchema = z.object({ query: z.string().trim().max(200), page: z.number().int().min(1).max(1_000_000) }).strict();
export const memberGrantSchema = z.object({ members: z.array(z.object({ id: cuidSchema, expectedVersion: z.number().int().positive() }).strict()).min(1).max(MAX_MEMBER_GRANTS) }).strict().refine(value => new Set(value.members.map(member => member.id)).size === value.members.length, 'Không chọn trùng thành viên.');
export type EligibleMember = { id: string; fullName: string; email: string; sessionVersion: number };
export type BulkMemberRow = { line: number; fullName: string; email: string; studentId: string; errors: string[] };
export type BulkMemberResult = BulkMemberRow & { status: 'CREATED' | 'SKIPPED' | 'FAILED'; message: string; userId?: string; temporaryPassword?: string };

export function memberLoginKey(value: string): string {
  return value.trim().toLowerCase().replace(/@(robotics|nexus)\.hcmus\.edu\.vn$/, '');
}
