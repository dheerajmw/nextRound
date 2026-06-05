import Link from "next/link";
import { DatabaseSetupNotice } from "@/components/dashboard/database-setup-notice";
import { StartInterviewForm } from "@/components/interview/start-interview-form";
import { isCoreSchemaAvailable } from "@/lib/db/schema-status";
import { QUESTIONS_PER_SESSION } from "@/lib/interview/constants";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export const metadata = {
  title: "New interview",
};

export default async function NewInterviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const coreReady = await isCoreSchemaAvailable();

  const { data: profile } = coreReady
    ? await supabase
        .from("profiles")
        .select("target_role")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            New mock interview
          </h1>
          <p className="text-muted-foreground">
            Voice & adaptive · {QUESTIONS_PER_SESSION} questions · all modes
          </p>
        </div>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Home
        </Link>
      </div>

      <div className="mb-6">
        <DatabaseSetupNotice />
      </div>

      <StartInterviewForm
        defaultTargetRole={profile?.target_role}
        schemaReady={coreReady}
      />
    </div>
  );
}
