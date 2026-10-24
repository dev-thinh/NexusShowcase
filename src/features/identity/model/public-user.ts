import { Prisma, Role } from '@prisma/client';

export const publicUserSelect = {
  id: true,
  fullName: true,
  avatarUrl: true,
  bio: true,
  githubUrl: true,
  linkedinUrl: true,
  googleScholarUrl: true,
  portfolioUrl: true,
  role: true,
} satisfies Prisma.UserSelect;

export const adminMemberClientSelect = {
  id: true,
  fullName: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  googleScholarUrl: string | null;
  portfolioUrl: string | null;
  role: Role;
};
