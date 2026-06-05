import Link from "next/link";
import { AcceptCohortInvites } from "@/components/partners/accept-cohort-invites";
import { DatabaseSetupNotice } from "@/components/dashboard/database-setup-notice";
import { PracticeInbox } from "@/components/dashboard/practice-inbox";
import { ProfileResumeCard } from "@/components/dashboard/profile-resume-card";
import { ReadinessDashboard } from "@/components/dashboard/readiness-dashboard";
import { BenchmarkCard } from "@/components/vision/benchmark-card";
import { SessionHistory } from "@/components/interview/session-history";
import { LlmPingButton } from "@/components/dashboard/llm-ping-button";
import { StitchIcon } from "@/components/layout/stitch-icon";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, target_role, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const name = profile?.display_name ?? "there";

  return (
    <>
      <AcceptCohortInvites />

      <div className="mb-8 space-y-4">
        <DatabaseSetupNotice />
        <p className="nr-body-muted">
          Welcome back, {name}. Track readiness, practice tasks, and session
          history.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4">
          <BenchmarkCard userId={user.id} />
        </div>

        <Card className="col-span-12 lg:col-span-8">
          <CardHeader>
            <span className="nr-pill nr-pill--primary mb-2 w-fit">
              Recommended next
            </span>
            <CardTitle className="text-xl">Start a mock interview</CardTitle>
            <CardDescription>
              Behavioral · adaptive follow-ups · AI scoring
              {profile?.target_role
                ? ` · Target: ${profile.target_role}`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/interviews/new"
              className={cn(
                buttonVariants({ size: "lg" }),
                "gap-2 font-mono text-[13px] font-bold tracking-wide"
              )}
            >
              <StitchIcon name="play_circle" size={20} />
              Start session
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="nr-label-caps mb-4">Readiness overview</h2>
          <ReadinessDashboard userId={user.id} />
        </section>

        <section>
          <PracticeInbox userId={user.id} />
        </section>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-6">
            <ProfileResumeCard />
          </div>

          <Card className="col-span-12 md:col-span-6">
            <CardHeader>
              <CardTitle>Your profile</CardTitle>
              <CardDescription>Used to tailor interview questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-[13px]">
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                {user.email}
              </p>
              <p>
                <span className="text-muted-foreground">Display name:</span>{" "}
                {profile?.display_name ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Target role:</span>{" "}
                {profile?.target_role ?? "Set when starting an interview"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Interview history</CardTitle>
            <CardDescription>Replay or continue past sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <SessionHistory userId={user.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Developer checks</CardTitle>
            <CardDescription>
              Health endpoint and server-side LLM ping
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-mono text-[13px] text-muted-foreground">
              Readiness API:{" "}
              <a
                href="/api/readiness"
                className="text-primary underline-offset-4 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                GET /api/readiness
              </a>
            </p>
            <LlmPingButton />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
