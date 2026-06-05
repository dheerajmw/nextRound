import {
  FOUNDATION_MIGRATION_HINT,
  FULL_MIGRATION_HINT,
  getSchemaStatus,
} from "@/lib/db/schema-status";

export async function DatabaseSetupNotice({
  requirePractice = false,
}: {
  requirePractice?: boolean;
}) {
  const status = await getSchemaStatus();

  if (!status.core) {
    return (
      <MigrationBanner
        title="Database setup required"
        body={FOUNDATION_MIGRATION_HINT}
        file="db/migrations/001_initial.sql"
      />
    );
  }

  if (requirePractice && !status.practice) {
    return (
      <MigrationBanner
        title="Phase 5 migration needed"
        body="Run db/migrations/006_practice_plans.sql after 001–005 for the improvement inbox."
        file="db/migrations/006_practice_plans.sql"
      />
    );
  }

  return null;
}

function MigrationBanner({
  title,
  body,
  file,
}: {
  title: string;
  body: string;
  file: string;
}) {
  return (
    <div
      className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm"
      role="status"
    >
      <p className="font-medium text-amber-200">{title}</p>
      <p className="mt-1 text-muted-foreground">{body}</p>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        Supabase → SQL Editor → {file}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{FULL_MIGRATION_HINT}</p>
    </div>
  );
}
