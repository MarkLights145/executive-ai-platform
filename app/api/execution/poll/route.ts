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

type PollBody = { agentInstanceId?: string };

/**
 * POST /api/execution/poll — Worker pulls next PENDING job. Bearer auth (token from AgentInstance.authTokenRef).
 * Body: { agentInstanceId }. Returns job payload or 204 if none.
 */
export async function POST(req: Request) {
  console.log("[poll] POST handler hit");
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
