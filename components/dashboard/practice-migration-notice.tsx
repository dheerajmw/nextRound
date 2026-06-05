import { DatabaseSetupNotice } from "@/components/dashboard/database-setup-notice";

export async function PracticeMigrationNotice() {
  return <DatabaseSetupNotice requirePractice />;
}
