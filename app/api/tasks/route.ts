import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export type Task = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  description?: string;
  source?: "openclaw" | "local";
};

/**
 * GET /api/tasks
 * Returns tasks for the current user. When OPENCLAW_API_URL is set and
 * OpenClaw is integrated, this will fetch from OpenClaw; otherwise
 * returns local/mock data.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: When OPENCLAW_API_URL is set, fetch tasks from OpenClaw and map to Task[]
  // const openclawUrl = process.env.OPENCLAW_API_URL;
  // if (openclawUrl) { ... fetch and return openclaw tasks ... }

  const tasks: Task[] = [];
  return NextResponse.json({ tasks });
}
