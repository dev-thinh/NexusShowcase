import { z } from 'zod';
import { cuidSchema } from '@/shared/lib/validation';

export const memberLifecycleSchema = z.object({
  operation: z.enum(['DISABLE', 'DELETE']),
  members: z.array(z.object({ id: cuidSchema, expectedVersion: z.number().int().positive() }).strict()).min(1).max(50),
}).strict().refine(input => new Set(input.members.map(member => member.id)).size === input.members.length, 'Không chọn trùng tài khoản.');

/** Historical snapshots keep the author's name while dropping the account link. */
export function externalizeAuthors(value: unknown, names: ReadonlyMap<string, string>): unknown {
  if (Array.isArray(value)) return value.map(entry => externalizeAuthors(entry, names));
  if (!value || typeof value !== 'object') return value;
  const object = Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, externalizeAuthors(entry, names)]));
  if (typeof object.userId === 'string' && names.has(object.userId)) {
    object.externalName = names.get(object.userId);
    object.displayName = names.get(object.userId);
    object.userId = null;
  }
  return object;
}

export const memberLifecycleSearchSchema = z.object({
  operation: z.enum(['DISABLE', 'DELETE', 'RESET']),
  query: z.string().trim().max(200),
  page: z.number().int().min(1).max(1_000_000),
}).strict();
