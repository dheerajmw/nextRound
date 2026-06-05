import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { hasLlmKeys } from "@/lib/env";
import { getSessionForUser, getTurnsForSession } from "@/lib/interview/session-access";
import { getAnswerText } from "@/lib/interview/answer-text";
import { analyzeSessionMedia } from "@/lib/vision/media-analysis";

const bodySchema = z.object({
  consent: z.literal(true),
  transcript: z.string().min(50).max(20000).optional(),
  duration_seconds: z.number().int().positive().optional(),
  storage_path: z.string().max(500).optional(),
  media_type: z.enum(["video", "audio"]).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!hasLlmKeys()) {
    return NextResponse.json({ error: "LLM not configured" }, { status: 503 });
  }

  const { id: sessionId } = await context.params;
  const session = await getSessionForUser(sessionId, auth.user.id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Consent required; provide transcript or complete session answers" },
      { status: 400 }
    );
  }

  const turns = await getTurnsForSession(sessionId);
  const transcript =
    parsed.data.transcript?.trim() ||
    turns
      .map((t) => `Q: ${t.question}\nA: ${getAnswerText(t)}`)
      .join("\n\n");

  if (transcript.length < 50) {
    return NextResponse.json(
      { error: "Need at least 50 characters of transcript" },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeSessionMedia({
      userId: auth.user.id,
      sessionId,
      targetRole: session.target_role ?? "Software Engineer",
      transcript,
      durationSeconds: parsed.data.duration_seconds,
      storagePath: parsed.data.storage_path,
      mediaType: parsed.data.media_type,
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
