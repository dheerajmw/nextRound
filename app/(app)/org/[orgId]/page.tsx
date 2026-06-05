import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CreateCohortForm } from "@/components/partners/create-cohort-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOrgMembership } from "@/lib/partners/access";
import { getCoachMenteeSummaries } from "@/lib/partners/coach-dashboard";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ orgId: string }> };

export default async function OrgDashboardPage({ params }: PageProps) {
  const { orgId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const membership = await getOrgMembership(orgId, user.id);
  if (!membership) notFound();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, brand_name, llm_daily_cap")
    .eq("id", orgId)
    .single();

  if (!org) notFound();

  const { data: cohorts } = await supabase
    .from("cohorts")
    .select("id, name, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  const isStaff = membership.role === "admin" || membership.role === "coach";
  const mentees =
    isStaff ? await getCoachMenteeSummaries(orgId) : [];

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {org.brand_name ?? org.name}
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            Your role: {membership.role} · LLM daily cap: {org.llm_daily_cap}
          </p>
        </div>
        <Link
          href="/org"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          ← Organizations
        </Link>
      </div>

      {isStaff ? (
        <Card>
          <CardHeader>
            <CardTitle>Cohorts</CardTitle>
            <CardDescription>
              Invite students by email; they join when they sign up with that
              email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CreateCohortForm orgId={orgId} />
            <ul className="space-y-2">
              {(cohorts ?? []).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/org/${orgId}/cohorts/${c.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
              {(cohorts ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No cohorts yet — create one above.
                </p>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {isStaff && mentees.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Coach view — mentees</CardTitle>
            <CardDescription>
              Readiness only; no access to interview answers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {mentees.map((m) => (
                <li
                  key={m.user_id}
                  className="flex flex-wrap justify-between gap-2 border-b py-2 last:border-0"
                >
                  <span>
                    {m.display_name ?? "Student"} · {m.target_role ?? "—"}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {m.readiness_index != null
                      ? `Readiness ${m.readiness_index}`
                      : "No score"}{" "}
                    · {m.session_count} sessions
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
