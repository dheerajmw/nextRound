import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { hasLlmKeys } from "@/lib/env";
import { parseProfileSkills } from "@/lib/enrichment/access";
import { extractSkillsFromResume } from "@/lib/enrichment/parse-resume";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

const bodySchema = z.object({
  resume_text: z.string().min(50).max(20000),
});

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("skills, resume_url, target_role")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  return NextResponse.json({
    skills: parseProfileSkills(profile?.skills ?? null),
    resume_url: profile?.resume_url ?? null,
    target_role: profile?.target_role ?? null,
  });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!hasLlmKeys()) {
    return NextResponse.json(
      { error: "LLM not configured for resume parsing" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Resume text must be 50–20,000 characters" },
      { status: 400 }
    );
  }

  try {
    const skills = await extractSkillsFromResume(parsed.data.resume_text);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ skills: skills as unknown as Json })
      .eq("user_id", auth.user.id)
      .select("skills, target_role")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      skills: parseProfileSkills(data.skills),
      message:
        "Skills extracted. Your next interview first question will use this context.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Resume parsing failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
