import type { InterviewMode } from "@/lib/supabase/database.types";
import type { InterviewDifficulty } from "@/lib/interview/constants";
import type { PreviousTurnContext } from "@/lib/interview/types";

export function buildGenerateQuestionPrompt(params: {
  role: string;
  mode: InterviewMode;
  questionIndex: number;
  totalQuestions: number;
  previousTurns: PreviousTurnContext[];
  difficulty: InterviewDifficulty;
  competencies?: string[];
  onetCodes?: string[];
  skills?: string[];
  bankSeedQuestion?: string;
  resumeSummary?: string;
  excludeQuestions?: string[];
}): string {
  const {
    role,
    mode,
    questionIndex,
    totalQuestions,
    previousTurns,
    difficulty,
  } = params;

  const history =
    previousTurns.length === 0
      ? "None yet."
      : previousTurns
          .map(
            (t, i) =>
              `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer}`
          )
          .join("\n\n");

  const difficultyGuide =
    difficulty === "hard"
      ? "Use a challenging scenario, time pressure, or trade-off. Expect detailed answers."
      : difficulty === "easy"
        ? "Use a straightforward, approachable question suitable for early practice."
        : "Use a standard professional interview question at moderate depth.";

  const modeGuide =
    mode === "technical"
      ? "Focus on problem-solving, system design, or coding judgment appropriate to the role."
      : mode === "hr"
        ? "Focus on culture fit, motivation, and situational judgment."
        : mode === "pm"
          ? "Focus on product sense, prioritization, metrics, and stakeholder management."
          : "Prefer STAR-friendly behavioral prompts (situation, ownership, outcome).";

  const competencyBlock =
    params.competencies && params.competencies.length > 0
      ? `\nRole competencies (O*NET-informed):\n${params.competencies.map((c) => `- ${c}`).join("\n")}`
      : "";

  const onetBlock =
    params.onetCodes && params.onetCodes.length > 0
      ? `\nO*NET occupation codes: ${params.onetCodes.join(", ")}`
      : "";

  const skillsBlock =
    params.skills && params.skills.length > 0
      ? `\nCandidate skills from resume (weave into question 1 context when relevant):\n${params.skills.map((s) => `- ${s}`).join("\n")}`
      : "";

  const resumeBlock = params.resumeSummary
    ? `\nResume summary: ${params.resumeSummary}`
    : "";

  const bankBlock = params.bankSeedQuestion
    ? `\nSeed question from curated bank (adapt wording for difficulty; keep core intent):\n"${params.bankSeedQuestion}"`
    : "";

  const resumeNote =
    params.skills?.length || params.resumeSummary
      ? "\nPersonalize using the candidate resume/skills when natural for this question."
      : "";

  const excludeBlock =
    params.excludeQuestions && params.excludeQuestions.length > 0
      ? `\nDo NOT repeat or closely paraphrase these questions from prior cancelled sessions:\n${params.excludeQuestions
          .slice(0, 20)
          .map((q) => `- ${q}`)
          .join("\n")}`
      : "";

  return `You are an expert interviewer conducting a ${mode} mock interview.

Candidate target role: ${role}
Question number: ${questionIndex + 1} of ${totalQuestions}
Difficulty: ${difficulty}
${difficultyGuide}
${modeGuide}${competencyBlock}${onetBlock}${skillsBlock}${resumeBlock}${bankBlock}${resumeNote}${excludeBlock}

Previous Q&A in this session:
${history}

Generate the next primary interview question. It must be distinct from prior questions.

Respond with ONLY valid JSON (no markdown), exactly this shape:
{"question":"...","rationale":"one sentence why this question fits"}`;
}
