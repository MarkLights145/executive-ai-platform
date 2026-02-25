"use server";

import { revalidatePath } from "next/cache";
import { getAppSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

async function requireProgrammer() {
  const { isProgrammer } = await getAppSession();
  if (!isProgrammer) throw new Error("Forbidden");
}

export async function deleteOrganization(orgId: string) {
  await requireProgrammer();
  await prisma.organization.delete({ where: { id: orgId } });
  revalidatePath("/app/programmers");
  revalidatePath(`/app/programmers/${orgId}`);
}

export async function updateOrganization(orgId: string, data: { name: string }) {
  await requireProgrammer();
  if (!data.name?.trim()) throw new Error("Name is required");
  await prisma.organization.update({
    where: { id: orgId },
    data: { name: data.name.trim() },
  });
  revalidatePath("/app/programmers");
  revalidatePath(`/app/programmers/${orgId}`);
}

export async function deleteUser(userId: string) {
  await requireProgrammer();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
  if (!user) throw new Error("User not found");
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/app/programmers");
  revalidatePath(`/app/programmers/${user.organizationId}`);
}

export async function updateUser(
  userId: string,
  data: { name?: string | null; email?: string; role?: string }
) {
  await requireProgrammer();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
  if (!user) throw new Error("User not found");
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
  revalidatePath("/app/programmers");
  revalidatePath(`/app/programmers/${user.organizationId}`);
}
