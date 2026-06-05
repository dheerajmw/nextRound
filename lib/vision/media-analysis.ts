import { z } from "zod";
import { buildAnalyzeMediaDeliveryPrompt } from "@/prompts/v1/analyze-media-delivery";
import { completeWithFallback } from "@/lib/llm/client";
import { extractJsonObject } from "@/lib/interview/parse-json";
import type { MediaAnalysisResult } from "@/lib/vision/types";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

const schema = z.object({
  confidence_score: z.number().min(0).max(100),
  delivery_score: z.number().min(0).max(100),
  emotion_summary: z.string(),
  filler_assessment: z.string(),
  recommendations: z.array(z.string()).min(1).max(5),
});

export async function analyzeSessionMedia(params: {
  userId: string;
  sessionId: string;
  targetRole: string;
  transcript: string;
  durationSeconds?: number;
  storagePath?: string;
  mediaType?: "video" | "audio";
}): Promise<MediaAnalysisResult> {
  const prompt = buildAnalyzeMediaDeliveryPrompt({
    role: params.targetRole,
    transcript: params.transcript,
    durationSeconds: params.durationSeconds,
  });

  const result = await completeWithFallback(prompt, 1024, {
    userId: params.userId,
  });
  const parsed = schema.parse(JSON.parse(extractJsonObject(result.text)));
  const analysis: MediaAnalysisResult = {
    confidence_score: parsed.confidence_score,
    delivery_score: parsed.delivery_score,
    emotion_summary: parsed.emotion_summary,
    filler_assessment: parsed.filler_assessment,
    recommendations: parsed.recommendations,
  };

  const supabase = await createClient();
  const consentAt = new Date().toISOString();

  await supabase.from("profiles").update({ media_consent_at: consentAt }).eq(
    "user_id",
    params.userId
  );

  await supabase.from("media_analysis").insert({
    user_id: params.userId,
    session_id: params.sessionId,
    media_type: params.mediaType ?? "video",
    storage_path: params.storagePath ?? null,
    consent_at: consentAt,
    analysis: analysis as unknown as Json,
  });

  return analysis;
}
