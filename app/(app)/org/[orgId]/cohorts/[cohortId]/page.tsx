import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CohortInviteForm } from "@/components/partners/cohort-invite-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getCohortInOrg,
  requireOrgStaff,
} from "@/lib/partners/access";
import { computeCohortAnalytics } from "@/lib/partners/cohort-analytics";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ orgId: string; cohortId: string }>;
};

export default async function CohortPage({ params }: PageProps) {
  const { orgId, cohortId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const access = await requireOrgStaff(orgId, user.id);
  if ("error" in access) notFound();

  const cohort = await getCohortInOrg(cohortId, orgId);
  if (!cohort) notFound();

  const { data: members } = await supabase
    .from("cohort_members")
    .select("id, email, status, invited_at, joined_at")
    .eq("cohort_id", cohortId)
    .order("invited_at", { ascending: false });

  const analytics = await computeCohortAnalytics(cohortId);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{cohort.name}</h1>
          <p className="text-sm text-muted-foreground">
            Cohort readiness — aggregates only
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/orgs/${orgId}/cohorts/${cohortId}/export`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Export CSV
          </a>
          <Link
            href={`/org/${orgId}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            ← Org
          </Link>
        </div>
      </div>

      {analytics ? (
        <Card>
          <CardHeader>
            <CardTitle>Cohort readiness</CardTitle>
            <CardDescription>{analytics.privacy_note}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Avg readiness</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {analytics.avg_readiness_index ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active members</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {analytics.active_member_count}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending invites</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {analytics.pending_invites}
                </p>
              </div>
            </div>
            {analytics.avg_scores ? (
              <p className="text-sm text-muted-foreground">
                Avg overall score: {analytics.avg_scores.overall}/100
              </p>
            ) : null}
            <ul className="space-y-2 text-sm border-t pt-4">
              {analytics.members.map((m) => (
                <li
                  key={m.member_id}
                  className="flex justify-between gap-2"
                >
                  <span>{m.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {m.readiness_index ?? "—"} · {m.session_count} sessions
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Invite students</CardTitle>
          <CardDescription>
            Up to 50 emails per batch. Users are linked when they log in with
            the same email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CohortInviteForm orgId={orgId} cohortId={cohortId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {(members ?? []).map((m) => (
              <li key={m.id} className="flex items-center gap-2">
                <span>{m.email}</span>
                <Badge variant="secondary">{m.status}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
