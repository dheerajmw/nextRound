import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { cancelInterviewSession } from "@/lib/interview/cancel-session";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id: sessionId } = await context.params;

  try {
    const session = await cancelInterviewSession({
      sessionId,
      userId: auth.user.id,
    });
    return NextResponse.json({ session, cancelled: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to cancel session";
    const status =
      message === "Session not found"
        ? 404
        : message === "Only in-progress sessions can be cancelled"
          ? 409
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
