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
        if (user.status !== 'ACTIVE') return null;

        const isPasswordMatch = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!isPasswordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
});
