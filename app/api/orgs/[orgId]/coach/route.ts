import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { requireOrgStaff } from "@/lib/partners/access";
import { getCoachMenteeSummaries } from "@/lib/partners/coach-dashboard";

type RouteContext = { params: Promise<{ orgId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { orgId } = await context.params;
  const access = await requireOrgStaff(orgId, auth.user.id, [
    "admin",
    "coach",
  ]);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const mentees = await getCoachMenteeSummaries(orgId);

  return NextResponse.json({
    mentees,
    privacy_note:
      "Read-only readiness summaries — no interview answers or transcripts.",
  });
}
