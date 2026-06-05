import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import {
  getCohortInOrg,
  requireOrgStaff,
} from "@/lib/partners/access";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsEvents } from "@/lib/analytics/events";

const inviteSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(50),
});

type RouteContext = {
  params: Promise<{ orgId: string; cohortId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email list" }, { status: 400 });
  }

  const supabase = await createClient();
  const rows = parsed.data.emails.map((email) => ({
    cohort_id: cohortId,
    email: email.trim().toLowerCase(),
    status: "pending" as const,
  }));

  const { data, error } = await supabase
    .from("cohort_members")
    .upsert(rows, { onConflict: "cohort_id,email", ignoreDuplicates: true })
    .select("id, email, status, invited_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.rpc("link_pending_cohort_members", {
    p_user_id: auth.user.id,
  });

  return NextResponse.json({
    invited: data?.length ?? rows.length,
    members: data ?? [],
    event: AnalyticsEvents.COHORT_INVITE_SENT,
  });
}
