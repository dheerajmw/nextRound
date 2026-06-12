import { NextResponse } from "next/server";
import { hasLlmKeys } from "@/lib/env";
import {
  completeWithFallback,
  formatLlmUserError,
  getLlmErrorStatus,
  LLM_PING_PROMPT,
} from "@/lib/llm/client";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasLlmKeys()) {
    return NextResponse.json(
      {
        ok: false,
        error: "No LLM keys configured",
        hint: "Set GEMINI_API_KEY and/or OPENROUTER_API_KEY",
      },
      { status: 503 }
    );
  }

  try {
    const result = await completeWithFallback(LLM_PING_PROMPT);
    return NextResponse.json({
      ok: true,
      provider: result.provider,
      model: result.model,
      message: result.text,
    });
  } catch (error) {
    const message = formatLlmUserError(error);
    return NextResponse.json(
      { ok: false, error: message },
      { status: getLlmErrorStatus(error) }
    );
  }
}
