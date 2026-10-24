import type { Role, UserStatus } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: NonNullable<DefaultSession['user']> & {
      id: string;
      role?: Role;
      mustChangePassword?: boolean;
    };
  }
  interface User {
    role?: Role;
    status?: UserStatus;
    mustChangePassword?: boolean;
    sessionVersion?: number;
  }
}
declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
    role?: Role;
    status?: UserStatus;
    mustChangePassword?: boolean;
    sessionVersion?: number;
  }
}
