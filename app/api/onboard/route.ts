import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/app/lib/db";
import { sendWelcomeEmail } from "@/app/lib/email";

const MIN_PASSWORD_LENGTH = 10;

export type OnboardBody = {
  kind?: "individual" | "organization";
  organizationName?: string;
  inviteCode?: string;
  name: string;
  email: string;
  password: string;
  telegramUsername?: string;
  preferences?: string[];
  featureRequest?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as OnboardBody;
    const { kind, organizationName, inviteCode, name, email, password, telegramUsername, preferences, featureRequest } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: "Password must be at least 10 characters." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in or use a different email." },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 10);

    if (inviteCode?.trim()) {
      const code = inviteCode.trim().toUpperCase();
      const invite = await prisma.inviteCode.findUnique({
        where: { code },
        include: { organization: true },
      });
      if (!invite) {
        return NextResponse.json({ error: "Invalid invite code." }, { status: 400 });
      }
      if (invite.usedAt) {
        return NextResponse.json({ error: "This invite code has already been used." }, { status: 400 });
      }
      if (new Date() > invite.expiresAt) {
        return NextResponse.json({ error: "This invite code has expired." }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            email: normalizedEmail,
            name: name.trim(),
            passwordHash,
            role: invite.role ?? "USER",
            organizationId: invite.organizationId,
            advisoryMode: true,
            telegramUserId: telegramUsername?.trim() || null,
            onboardingPreferences: preferences?.length ? (preferences as unknown as object) : undefined,
            featureRequest: featureRequest?.trim() || null,
          },
        });
        await tx.inviteCode.update({
          where: { id: invite.id },
          data: { usedAt: new Date() },
        });
      });
      await sendWelcomeEmail(name.trim(), normalizedEmail);
      return NextResponse.json({ ok: true });
    }

    const orgName =
      kind === "organization" && organizationName?.trim()
        ? organizationName.trim()
        : `${name.trim()} (Personal)`;

    await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: orgName },
      });
      await tx.user.create({
        data: {
          email: normalizedEmail,
          name: name.trim(),
          passwordHash,
          role: "ADMIN",
          organizationId: org.id,
          advisoryMode: true,
          telegramUserId: telegramUsername?.trim() || null,
          onboardingPreferences: preferences?.length ? (preferences as unknown as object) : undefined,
          featureRequest: featureRequest?.trim() || null,
        },
      });
    });

    await sendWelcomeEmail(name.trim(), normalizedEmail);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("onboard error", message, e);
    return NextResponse.json({ error: "Onboarding failed." }, { status: 500 });
  }
}
