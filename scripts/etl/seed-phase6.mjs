/**
 * Phase 6 ETL — seed question_bank and role_templates.
 * Run after migration 007. Requires service role (bypasses RLS for insert).
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/etl/seed-phase6.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const roleTemplates = JSON.parse(
  readFileSync(join(__dirname, "data/role-templates.json"), "utf8")
);
const questions = JSON.parse(
  readFileSync(join(__dirname, "data/question-bank.json"), "utf8")
);

async function main() {
  console.log("Seeding role_templates…");
  const { error: rolesError } = await supabase.from("role_templates").upsert(
    roleTemplates.map((r) => ({
      role_key: r.role_key,
      display_name: r.display_name,
      competencies: r.competencies,
      rubric_weights: r.rubric_weights,
      onet_codes: r.onet_codes ?? [],
    })),
    { onConflict: "role_key" }
  );
  if (rolesError) throw rolesError;

  console.log("Clearing question_bank (idempotent re-seed)…");
  const { error: delError } = await supabase
    .from("question_bank")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (delError) throw delError;

  console.log(`Inserting ${questions.length} questions…`);
  const { error: qError } = await supabase.from("question_bank").insert(
    questions.map((q) => ({
      role_key: q.role_key,
      mode: q.mode,
      difficulty: q.difficulty,
      text: q.text,
      tags: q.tags ?? [],
      source: q.source ?? "curated",
    }))
  );
  if (qError) throw qError;

  console.log("Phase 6 seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
