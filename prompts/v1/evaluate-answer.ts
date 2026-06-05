import type { InterviewMode } from "@/lib/supabase/database.types";
import type { RubricWeights } from "@/lib/enrichment/types";

export function buildEvaluateAnswerPrompt(params: {
  role: string;
  mode: InterviewMode;
  question: string;
  answer: string;
  heuristicFillerCount: number;
  rubricWeights?: RubricWeights;
  competencies?: string[];
}): string {
  const { role, mode, question, answer, heuristicFillerCount } = params;

  const weights = params.rubricWeights;
  const weightGuide = weights
    ? `\nRole-specific rubric emphasis (weights sum to 1): communication ${weights.communication}, structure ${weights.structure}, content ${weights.content}, logical_flow ${weights.logical_flow}. Score accordingly.`
    : "";

  const competencyGuide =
    params.competencies && params.competencies.length > 0
      ? `\nEvaluate content against these role competencies:\n${params.competencies.map((c) => `- ${c}`).join("\n")}`
      : "";

  return `You are an expert interview coach evaluating a mock interview answer.

Target role: ${role}
Interview mode: ${mode}
Heuristic filler-word count (text): ${heuristicFillerCount}${weightGuide}${competencyGuide}

Question:
${question}

Candidate answer:
${answer}

Score each dimension from 0 to 100 (integers):
- communication: clarity, concision, confidence in delivery
- structure: organization; STAR framework usage for behavioral answers
- content: relevance, specificity, quantified impact where appropriate
- logical_flow: coherent progression, no major gaps or contradictions
- overall: holistic interview readiness for this answer

Also provide:
- star_detected: true if answer follows Situation, Task, Action, Result
- strengths: 2-3 short bullet strings
- improvements: 2-3 actionable short bullet strings

Respond with ONLY valid JSON (no markdown), exactly:
{
  "scores": {
    "communication": 0,
    "structure": 0,
    "content": 0,
    "logical_flow": 0,
    "overall": 0
  },
  "star_detected": false,
  "strengths": ["..."],
  "improvements": ["..."]
}`;
}
