"use server";

import { revalidatePath } from "next/cache";
import { getAppSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

async function requireAdminOrg() {
  const { user } = await getAppSession();
  if (!user?.organizationId || user.role !== "ADMIN") throw new Error("Forbidden");
  return user.organizationId;
}

export async function updateOrgUser(
  userId: string,
  data: { name?: string | null; email?: string; role?: string }
) {
  const organizationId = await requireAdminOrg();
  const target = await prisma.user.findFirstOrThrow({
    where: { id: userId, organizationId },
  });
  if (data.email !== undefined && !data.email?.trim()) throw new Error("Email is required");
  if (data.role !== undefined && !["USER", "ADMIN"].includes(data.role)) throw new Error("Invalid role");
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name?.trim() || null }),
      ...(data.email !== undefined && { email: data.email.trim() }),
      ...(data.role !== undefined && { role: data.role }),
    },
  });
  revalidatePath("/app/users");
}

export async function pingOrgUser(userId: string) {
  const organizationId = await requireAdminOrg();
  await prisma.user.findFirstOrThrow({
    where: { id: userId, organizationId },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { lastPingedAt: new Date() },
  });
  revalidatePath("/app/users");
}
