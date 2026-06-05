import { z } from "zod";
import { buildEvaluateAnswerPrompt } from "@/prompts/v1/evaluate-answer";
import { EVALUATION_PROMPT_VERSION } from "@/lib/evaluation/constants";
import { countFillerWords } from "@/lib/evaluation/filler-words";
import type {
  EvaluationFeedback,
  EvaluationScores,
} from "@/lib/evaluation/types";
import { extractJsonObject } from "@/lib/interview/parse-json";
import { completeWithFallback } from "@/lib/llm/client";
import { getEnrichmentContext } from "@/lib/enrichment/access";
import type { InterviewMode } from "@/lib/supabase/database.types";
import type { LlmProvider } from "@/lib/llm/client";

const scoreSchema = z.object({
  communication: z.number().min(0).max(100),
  structure: z.number().min(0).max(100),
  content: z.number().min(0).max(100),
  logical_flow: z.number().min(0).max(100),
  overall: z.number().min(0).max(100),
});

const evaluationSchema = z.object({
  scores: scoreSchema,
  star_detected: z.boolean(),
  strengths: z.array(z.string()).min(1).max(5),
  improvements: z.array(z.string()).min(1).max(5),
});

export type EvaluateTurnInput = {
  role: string;
  mode: InterviewMode;
  question: string;
  answer: string;
  userId?: string;
};

export type EvaluateTurnOutput = {
  scores: EvaluationScores;
  feedback: EvaluationFeedback;
  model: string;
  provider: LlmProvider;
  prompt_version: string;
};

export async function evaluateTurn(
  input: EvaluateTurnInput
): Promise<EvaluateTurnOutput> {
  const heuristicFillerCount = countFillerWords(input.answer);
  const enrichment = await getEnrichmentContext({
    targetRole: input.role,
    mode: input.mode,
  });

  const prompt = buildEvaluateAnswerPrompt({
    ...input,
    heuristicFillerCount,
    rubricWeights: enrichment.rubric_weights,
    competencies: enrichment.competencies,
  });

  const result = await completeWithFallback(prompt, 2048, {
    userId: input.userId,
  });
  const parsed = evaluationSchema.parse(
    JSON.parse(extractJsonObject(result.text))
  );

  return {
    scores: parsed.scores,
    feedback: {
      star_detected: parsed.star_detected,
      filler_word_count: heuristicFillerCount,
      strengths: parsed.strengths.map((s) => s.trim()),
      improvements: parsed.improvements.map((s) => s.trim()),
    },
    model: result.model,
    provider: result.provider,
    prompt_version: EVALUATION_PROMPT_VERSION,
  };
}
