import { NextResponse } from "next/server";

/**
 * GET /api/health — Safe health check for workers. No secret values.
 * Returns ok, commit (from Vercel), and env sanity flags (booleans only).
 */
export async function GET() {
  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_REF ?? "unknown";
  const sanity = {
    hasDb: Boolean(process.env.DATABASE_URL),
    hasAuth: Boolean(
      process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_URL
    ),
  };
  return NextResponse.json({ ok: true, commit, ...sanity });
}
