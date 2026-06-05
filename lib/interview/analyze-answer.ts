import type { InterviewMode } from "@/lib/supabase/database.types";

const STAR_PATTERN =
  /\b(situation|task|action|result|challenge|outcome|learned)\b/i;

export type AnswerAnalysis = {
  word_count: number;
  is_vague: boolean;
  star_detected: boolean;
  lacks_structure: boolean;
};

export function analyzeAnswer(
  text: string,
  mode: InterviewMode
): AnswerAnalysis {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const word_count = words.length;
  const star_detected = STAR_PATTERN.test(trimmed);
  const is_vague = word_count < 45;
  const lacks_structure =
    mode === "behavioral" && !star_detected && word_count >= 20;

  return {
    word_count,
    is_vague,
    star_detected,
    lacks_structure,
  };
}
