import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().min(3),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Tên đăng nhập hoặc Email', type: 'text' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const identifier = parsed.data.email.trim();
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { email: identifier.toLowerCase() },
              { email: `${identifier.toLowerCase()}@nexus.hcmus.edu.vn` },
            ],
          },
        });

        if (!user || !user.passwordHash) return null;
        if (user.status !== 'ACTIVE' || user.deletedAt) return null;

        const isPasswordMatch = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!isPasswordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          status: user.status,
          mustChangePassword: user.mustChangePassword,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
        token.status = (user as unknown as { status: string }).status;
        token.sessionVersion = (user as unknown as { sessionVersion: number }).sessionVersion;
        token.mustChangePassword = (user as unknown as { mustChangePassword: boolean }).mustChangePassword;
        return token;
      }

      if (token?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            status: true,
            sessionVersion: true,
            mustChangePassword: true,
            deletedAt: true,
          },
        });

        if (!dbUser || dbUser.status !== 'ACTIVE' || dbUser.deletedAt || dbUser.sessionVersion !== token.sessionVersion) {
          token.id = undefined;
          token.role = undefined;
          token.status = 'SUSPENDED';
          return token;
        }

        token.role = dbUser.role;
        token.status = dbUser.status;
        token.mustChangePassword = dbUser.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (!token?.id || token.status !== 'ACTIVE') {
        return null as any;
      }
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as { role: string }).role = token.role as string;
        (session.user as unknown as { mustChangePassword: boolean }).mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
});
