import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { organization: true },
        });
        if (!user?.passwordHash) return null;
        const ok = await compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
        } as { id: string; email: string | null; name: string | null; role: string; organizationId: string; organizationName: string };
      },
    }),
    // Microsoft: present but disabled until env vars exist
    // Uncomment and set AUTH_MICROSOFT_ID + AUTH_MICROSOFT_SECRET to enable:
    // MicrosoftProvider({
    //   clientId: process.env.AUTH_MICROSOFT_ID!,
    //   clientSecret: process.env.AUTH_MICROSOFT_SECRET!,
    // }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.organizationId = (user as { organizationId?: string }).organizationId;
        token.organizationName = (user as { organizationName?: string }).organizationName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { organizationId?: string }).organizationId = token.organizationId as string;
        (session.user as { organizationName?: string }).organizationName = token.organizationName as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};
