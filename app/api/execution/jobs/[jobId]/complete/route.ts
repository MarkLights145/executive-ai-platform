import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h || typeof h !== "string") return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

async function validateAgentBearer(agentInstanceId: string, bearerToken: string): Promise<boolean> {
  const instance = await prisma.agentInstance.findUnique({
    where: { id: agentInstanceId },
    select: { authTokenRef: true },
  });
  if (!instance?.authTokenRef?.trim()) return false;
  const secret = process.env[instance.authTokenRef.trim()];
  return typeof secret === "string" && secret.length > 0 && secret === bearerToken;
}

type CompleteBody = { outputText?: string; errorText?: string };

/**
 * POST /api/execution/jobs/[jobId]/complete — Worker reports job result. Bearer auth.
 * Body: { outputText } or { errorText }. Sets status DONE or ERROR.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;
  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  const job = await prisma.executionJob.findUnique({
    where: { id: jobId },
    select: { id: true, agentInstanceId: true, status: true },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (job.status === "DONE" || job.status === "ERROR") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const valid = await validateAgentBearer(job.agentInstanceId, token);
  if (!valid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: CompleteBody;
  try {
    body = (await req.json()) as CompleteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const outputText = body.outputText?.trim();
  const errorText = body.errorText?.trim();
  const hasOutput = outputText !== undefined && outputText !== "";
  const hasError = errorText !== undefined && errorText !== "";

  if (hasError) {
    await prisma.executionJob.update({
      where: { id: jobId },
      data: { status: "ERROR", errorText: errorText || null, updatedAt: new Date() },
    });
  } else if (hasOutput) {
    await prisma.executionJob.update({
      where: { id: jobId },
      data: { status: "DONE", resultText: outputText || null, updatedAt: new Date() },
    });
  } else {
    return NextResponse.json(
      { error: "Provide outputText or errorText" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
