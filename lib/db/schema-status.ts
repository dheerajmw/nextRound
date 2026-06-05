import {
  FOUNDATION_MIGRATION_HINT,
  FULL_MIGRATION_HINT,
  isMissingTableError,
} from "@/lib/db/schema-errors";
import { createClient } from "@/lib/supabase/server";

export { FOUNDATION_MIGRATION_HINT, FULL_MIGRATION_HINT };

export const FOUNDATION_MIGRATION_FILES = [
  "001_initial.sql",
  "002_interview_turns.sql",
  "003_evaluations.sql",
  "004_readiness.sql",
  "005_voice_adaptive.sql",
] as const;

async function tableReachable(
  table: "interview_sessions" | "practice_tasks" | "role_templates"
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from(table).select("id").limit(1);
  if (error && isMissingTableError(error)) return false;
  return !error;
}

export async function isCoreSchemaAvailable(): Promise<boolean> {
  return tableReachable("interview_sessions");
}

export async function isPracticeSchemaAvailable(): Promise<boolean> {
  return tableReachable("practice_tasks");
}

export type SchemaStatus = {
  core: boolean;
  practice: boolean;
  enrichment: boolean;
};

export async function getSchemaStatus(): Promise<SchemaStatus> {
  const [core, practice, enrichment] = await Promise.all([
    tableReachable("interview_sessions"),
    tableReachable("practice_tasks"),
    tableReachable("role_templates"),
  ]);
  return { core, practice, enrichment };
}
