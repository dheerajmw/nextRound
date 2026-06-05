import type { InterviewMode } from "@/lib/supabase/database.types";

const ROLE_PATTERNS: Array<{ key: string; patterns: RegExp[] }> = [
  {
    key: "product_manager",
    patterns: [
      /\bproduct\s*manager\b/i,
      /\bapm\b/i,
      /\bproduct\s*owner\b/i,
      /\bpm\b/i,
    ],
  },
  {
    key: "software_engineer",
    patterns: [
      /\bsoftware\s*engineer/i,
      /\bswe\b/i,
      /\bdeveloper\b/i,
      /\bfull[\s-]?stack\b/i,
      /\bbackend\b/i,
      /\bfrontend\b/i,
    ],
  },
  {
    key: "data_analyst",
    patterns: [
      /\bdata\s*analyst\b/i,
      /\bdata\s*scientist\b/i,
      /\banalytics\b/i,
    ],
  },
  {
    key: "hr_generalist",
    patterns: [/\bhr\b/i, /\bhuman\s*resources\b/i, /\bpeople\s*ops\b/i],
  },
];

const MODE_FALLBACK: Record<InterviewMode, string> = {
  pm: "product_manager",
  technical: "software_engineer",
  hr: "hr_generalist",
  behavioral: "behavioral_general",
};

export function resolveRoleKey(
  targetRole: string,
  mode: InterviewMode
): string {
  const normalized = targetRole.trim();
  for (const { key, patterns } of ROLE_PATTERNS) {
    if (patterns.some((p) => p.test(normalized))) return key;
  }
  return MODE_FALLBACK[mode];
}
