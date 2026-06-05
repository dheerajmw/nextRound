import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import {
  getCohortInOrg,
  requireOrgStaff,
} from "@/lib/partners/access";
import {
  cohortAnalyticsToCsv,
  computeCohortAnalytics,
} from "@/lib/partners/cohort-analytics";

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

  const analytics = await computeCohortAnalytics(cohortId);
  if (!analytics) {
    return NextResponse.json({ error: "Analytics unavailable" }, { status: 500 });
  }

  const csv = cohortAnalyticsToCsv(analytics);
  const filename = `cohort-${cohort.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-readiness.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
