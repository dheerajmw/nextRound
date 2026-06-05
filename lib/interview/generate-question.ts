import { z } from "zod";
import { buildGenerateQuestionPrompt } from "@/prompts/v1/generate-question";
import { getEnrichmentContext } from "@/lib/enrichment/access";
import {
  pickBankQuestion,
  shouldPreferBankQuestion,
} from "@/lib/enrichment/pick-bank-question";
import { completeWithFallback } from "@/lib/llm/client";
import { extractJsonObject } from "@/lib/interview/parse-json";
import type { GeneratedQuestion, PreviousTurnContext } from "@/lib/interview/types";
import type { InterviewDifficulty } from "@/lib/interview/constants";
import type { InterviewMode } from "@/lib/supabase/database.types";
import { QUESTIONS_PER_SESSION } from "@/lib/interview/constants";
import {
  getCompanyProfile,
  pickCompanyQuestion,
} from "@/lib/vision/companies";

const questionSchema = z.object({
  question: z.string().min(10),
  rationale: z.string().min(5),
});

export type GenerateQuestionResult = GeneratedQuestion & {
  source?: "bank" | "llm" | "bank_adapted" | "company";
};

export async function generateInterviewQuestion(params: {
  role: string;
  mode: InterviewMode;
  questionIndex: number;
  previousTurns: PreviousTurnContext[];
  difficulty?: InterviewDifficulty;
  totalQuestions?: number;
  userId?: string;
  excludeQuestions?: string[];
  companyProfileId?: string;
}): Promise<GenerateQuestionResult> {
  const difficulty = params.difficulty ?? "medium";

  const excludeTexts = [
    ...(params.excludeQuestions ?? []),
    ...params.previousTurns.map((t) => t.question),
  ];

  if (params.companyProfileId) {
    const company = await getCompanyProfile(params.companyProfileId);
    if (company && company.question_pack.length > 0) {
      const companyQ = pickCompanyQuestion(
        company.question_pack,
        params.questionIndex,
        excludeTexts
      );
      if (companyQ) {
        return {
          question: companyQ,
          rationale: `${company.name} simulation — ${company.interview_focus ?? "role-specific interview"}.`,
          source: "company",
        };
      }
    }
  }

  const enrichment = await getEnrichmentContext({
    targetRole: params.role,
    mode: params.mode,
    userId: params.userId,
  });

  const bankQuestion = await pickBankQuestion({
    mode: params.mode,
    roleKey: enrichment.role_key,
    difficulty,
    excludeTexts,
  });

  const useBankDirect =
    bankQuestion &&
    (shouldPreferBankQuestion(params.mode) ||
      params.questionIndex === 0 ||
      params.questionIndex % 2 === 0);

  if (useBankDirect && bankQuestion && shouldPreferBankQuestion(params.mode)) {
    const tags = bankQuestion.tags.length ? bankQuestion.tags.join(", ") : "curated";
    return {
      question: bankQuestion.text.trim(),
      rationale: `From question bank (${tags}). Targets: ${enrichment.competencies.slice(0, 2).join("; ")}.`,
      source: "bank",
    };
  }

  const hasResume = Boolean(enrichment.skills?.items.length);
  const skillsForPrompt = hasResume
    ? enrichment.skills!.items.slice(0, 8)
    : undefined;

  const prompt = buildGenerateQuestionPrompt({
    role: params.role,
    mode: params.mode,
    questionIndex: params.questionIndex,
    totalQuestions: params.totalQuestions ?? QUESTIONS_PER_SESSION,
    previousTurns: params.previousTurns,
    difficulty,
    competencies: enrichment.competencies,
    onetCodes: enrichment.role_template.onet_codes,
    skills: skillsForPrompt,
    resumeSummary: hasResume ? enrichment.skills?.summary : undefined,
    bankSeedQuestion: bankQuestion?.text,
    excludeQuestions: excludeTexts.slice(0, 20),
  });

  const result = await completeWithFallback(prompt, 1024, {
    userId: params.userId,
  });
  const jsonText = extractJsonObject(result.text);
  const parsed = questionSchema.parse(JSON.parse(jsonText));

  return {
    question: parsed.question.trim(),
    rationale: parsed.rationale.trim(),
    source: bankQuestion ? "bank_adapted" : "llm",
  };
}
