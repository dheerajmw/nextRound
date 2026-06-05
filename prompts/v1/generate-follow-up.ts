import type { InterviewMode } from "@/lib/supabase/database.types";
import type { InterviewDifficulty } from "@/lib/interview/constants";

export function buildGenerateFollowUpPrompt(params: {
  role: string;
  mode: InterviewMode;
  difficulty: InterviewDifficulty;
  originalQuestion: string;
  answer: string;
  reason: string;
}): string {
  return `You are an expert interviewer conducting a ${params.mode} mock interview.

Target role: ${params.role}
Difficulty: ${params.difficulty}

The candidate answered a question but needs a follow-up before moving on.

Original question:
${params.originalQuestion}

Candidate answer:
${params.answer}

Why follow up: ${params.reason}

Generate ONE focused follow-up question. For behavioral mode, guide toward STAR (situation, task, action, result) if structure was weak.

Respond with ONLY valid JSON:
{"question":"...","rationale":"one sentence"}`;
}
