import type { InterviewDifficulty } from "@/lib/interview/constants";
import type { BankQuestion } from "@/lib/enrichment/types";
import { createClient } from "@/lib/supabase/server";
import type { InterviewMode } from "@/lib/supabase/database.types";

export async function pickBankQuestion(params: {
  mode: InterviewMode;
  roleKey: string;
  difficulty: InterviewDifficulty;
  excludeTexts?: string[];
}): Promise<BankQuestion | null> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("question_bank")
    .select("id, role_key, mode, difficulty, text, tags, source")
    .eq("mode", params.mode)
    .eq("difficulty", params.difficulty);

  if (error || !rows?.length) {
    const { data: relaxed } = await supabase
      .from("question_bank")
      .select("id, role_key, mode, difficulty, text, tags, source")
      .eq("mode", params.mode);

    if (!relaxed?.length) return null;
    return selectFromPool(relaxed as BankQuestion[], params);
  }

  return selectFromPool(rows as BankQuestion[], params);
}

function selectFromPool(
  pool: BankQuestion[],
  params: {
    roleKey: string;
    excludeTexts?: string[];
  }
): BankQuestion | null {
  const excluded = new Set(
    (params.excludeTexts ?? []).map((t) => t.trim().toLowerCase())
  );

  const roleSpecific = pool.filter(
    (q) => q.role_key === params.roleKey && !excluded.has(q.text.toLowerCase())
  );
  const generic = pool.filter(
    (q) => !q.role_key && !excluded.has(q.text.toLowerCase())
  );
  const anyRole = pool.filter(
    (q) => q.role_key && q.role_key !== params.roleKey && !excluded.has(q.text.toLowerCase())
  );

  const ordered = [...roleSpecific, ...generic, ...anyRole];
  if (ordered.length === 0) return null;

  const index = Math.floor(Math.random() * Math.min(ordered.length, 8));
  return ordered[index] ?? ordered[0];
}

/** PM interviews should use the bank when a match exists (Phase 6 exit criteria). */
export function shouldPreferBankQuestion(mode: InterviewMode): boolean {
  return mode === "pm";
}
