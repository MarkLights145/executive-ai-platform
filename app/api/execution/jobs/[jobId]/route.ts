import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

/**
 * GET /api/execution/jobs/[jobId] — Get job status (admin, same org). Returns { status, resultText?, errorText? }.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; organizationId?: string } | undefined;

  if (!user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  const { jobId } = await params;
  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  const job = await prisma.executionJob.findFirst({
    where: { id: jobId, orgId: user.organizationId },
    select: { status: true, resultText: true, errorText: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    resultText: job.resultText ?? undefined,
    errorText: job.errorText ?? undefined,
  });
}
