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
        token.email = (user as { email?: string }).email ?? null;
        token.name = (user as { name?: string }).name ?? null;
        token.role = (user as { role?: string }).role;
        token.organizationId = (user as { organizationId?: string }).organizationId;
        token.organizationName = (user as { organizationName?: string }).organizationName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { email?: string | null }).email = (token.email as string | null) ?? undefined;
        (session.user as { name?: string | null }).name = (token.name as string | null) ?? undefined;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { organizationId?: string }).organizationId = token.organizationId as string;
        (session.user as { organizationName?: string }).organizationName = token.organizationName as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};

export type AppSessionUser = {
  id?: string;
  email?: string | null;
  role?: string;
  organizationId?: string;
  organizationName?: string | null;
};

const PROGRAMMER_EMAIL_DEFAULT = "mamiller561@gmail.com";

function getProgrammerEmails(): string[] {
  const fromEnv = (process.env.PROGRAMMER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const list = fromEnv.length > 0 ? fromEnv : [PROGRAMMER_EMAIL_DEFAULT];
  // Always include default so this account never loses access regardless of env
  if (!list.includes(PROGRAMMER_EMAIL_DEFAULT)) list.push(PROGRAMMER_EMAIL_DEFAULT);
  return list;
}

export async function getAppSession(): Promise<{
  user: AppSessionUser | undefined;
  isProgrammer: boolean;
}> {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  const user = session?.user as AppSessionUser | undefined;
  const programmerEmails = getProgrammerEmails();

  // Prefer session email; if missing (e.g. old JWT), resolve from DB so programmer check always works
  let email = user?.email?.trim().toLowerCase();
  const userId = (session?.user as { id?: string })?.id;
  if (!email && userId) {
    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    email = dbUser?.email?.trim().toLowerCase() ?? undefined;
  }
  const isProgrammer = !!(email && programmerEmails.includes(email));

  // Ensure we pass through email/name for UI even if we had to load from DB
  const userForLayout: AppSessionUser | undefined = user
    ? { ...user, email: user.email ?? email ?? undefined }
    : undefined;

  return { user: userForLayout, isProgrammer };
}
