import { z } from "zod";
import { buildGenerateFollowUpPrompt } from "@/prompts/v1/generate-follow-up";
import { completeWithFallback } from "@/lib/llm/client";
import { parseJsonObject } from "@/lib/interview/parse-json";
import type { GeneratedQuestion } from "@/lib/interview/types";
import type { InterviewDifficulty } from "@/lib/interview/constants";
import type { InterviewMode } from "@/lib/supabase/database.types";

const questionSchema = z.object({
  question: z.string().min(10),
  rationale: z.string().min(5),
});

export async function generateFollowUpQuestion(params: {
  role: string;
  mode: InterviewMode;
  difficulty: InterviewDifficulty;
  originalQuestion: string;
  answer: string;
  reason: string;
  userId?: string;
}): Promise<GeneratedQuestion> {
  const prompt = buildGenerateFollowUpPrompt(params);
  const result = await completeWithFallback(prompt, 1024, {
    userId: params.userId,
    jsonMode: true,
  });
  const parsed = parseJsonObject(result.text, (value) =>
    questionSchema.parse(value)
  );

  return {
    question: parsed.question.trim(),
    rationale: parsed.rationale.trim(),
  };
}
