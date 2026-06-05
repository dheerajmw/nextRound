import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import {
  getCohortInOrg,
  requireOrgStaff,
} from "@/lib/partners/access";
import { computeCohortAnalytics } from "@/lib/partners/cohort-analytics";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ orgId: string; cohortId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { orgId, cohortId } = await context.params;
  const access = await requireOrgStaff(orgId, auth.user.id);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const cohort = await getCohortInOrg(cohortId, orgId);
  if (!cohort) {
    return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("cohort_members")
    .select("id, email, user_id, status, invited_at, joined_at")
    .eq("cohort_id", cohortId)
    .order("invited_at", { ascending: false });

  const analytics = await computeCohortAnalytics(cohortId);

  return NextResponse.json({
    cohort,
    members: members ?? [],
    analytics,
  });
}
