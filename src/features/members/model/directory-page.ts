import { z } from 'zod';

export const MEMBER_DIRECTORY_PAGE_SIZE = 30;
export const memberDirectoryRequestSchema = z.object({
  role: z.enum(['ADMIN', 'CORE_MEMBER', 'MEMBER']),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
}).strict();
