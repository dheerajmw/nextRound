/** PostgREST / Supabase errors when a migration was not applied yet. */
export function isMissingTableError(error: {
  message?: string;
  code?: string;
} | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    msg.includes("schema cache") ||
    msg.includes("could not find the table")
  );
}

export const FULL_MIGRATION_HINT =
  "Run db/migrations/001_initial.sql through 009_vision.sql in the Supabase SQL Editor (in order), then reload the app.";

export const FOUNDATION_MIGRATION_HINT =
  "Run db/migrations/001_initial.sql first (creates profiles and interview_sessions), then 002–005 for full mock interviews. See README or run: npm run check:migrations";

export const PRACTICE_PLANS_MIGRATION_HINT =
  "Run db/migrations/006_practice_plans.sql in the Supabase SQL Editor (after migrations 001–005), then reload the dashboard.";

export function schemaUnavailableBody(
  error: { message?: string; code?: string } | null
) {
  if (!isMissingTableError(error)) return null;
  return {
    error: "Database not set up",
    hint: FOUNDATION_MIGRATION_HINT,
    migration: "db/migrations/001_initial.sql",
  };
}
