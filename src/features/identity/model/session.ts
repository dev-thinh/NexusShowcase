import type { Role } from '@prisma/client';

export type Actor = {
  id: string;
  fullName: string;
  role: Role;
  status: 'ACTIVE';
  mustChangePassword: boolean;
};
