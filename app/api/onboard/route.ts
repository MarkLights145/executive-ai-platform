import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/app/lib/db";

const MIN_PASSWORD_LENGTH = 10;

export type OnboardBody = {
  kind: "individual" | "organization";
  organizationName?: string;
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
    const { kind, organizationName, name, email, password, telegramUsername, preferences, featureRequest } = body;

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

    const orgName =
      kind === "organization" && organizationName?.trim()
        ? organizationName.trim()
        : `${name.trim()} (Personal)`;

    const passwordHash = await hash(password, 10);

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

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("onboard error", message, e);
    return NextResponse.json({ error: "Onboarding failed." }, { status: 500 });
  }
}
