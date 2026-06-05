/**
 * Seed company_profiles for Phase 8+.
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/etl/seed-phase8.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const companies = JSON.parse(
  readFileSync(join(__dirname, "data/company-profiles.json"), "utf8")
);

async function main() {
  for (const c of companies) {
    const { error } = await supabase.from("company_profiles").upsert(
      {
        slug: c.slug,
        name: c.name,
        description: c.description,
        interview_focus: c.interview_focus,
        question_pack: c.question_pack,
        rubric_emphasis: c.rubric_emphasis ?? null,
      },
      { onConflict: "slug" }
    );
    if (error) throw error;
  }
  console.log(`Seeded ${companies.length} company profiles.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
