import { z } from "zod";
import { buildExtractResumeSkillsPrompt } from "@/prompts/v1/extract-resume-skills";
import { extractJsonObject } from "@/lib/interview/parse-json";
import { completeWithFallback } from "@/lib/llm/client";
import type { ProfileSkills } from "@/lib/enrichment/types";

const schema = z.object({
  summary: z.string().min(5),
  skills: z.array(z.string().min(2)).min(1).max(20),
});

export async function extractSkillsFromResume(
  resumeText: string
): Promise<ProfileSkills> {
  const prompt = buildExtractResumeSkillsPrompt(resumeText);
  const result = await completeWithFallback(prompt, 1024);
  const parsed = schema.parse(JSON.parse(extractJsonObject(result.text)));

  return {
    items: parsed.skills.map((s) => s.trim()).filter(Boolean),
    summary: parsed.summary.trim(),
    extracted_at: new Date().toISOString(),
  };
}
