import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { getOrgMembership } from "@/lib/partners/access";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ orgId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { orgId } = await context.params;
  const membership = await getOrgMembership(orgId, auth.user.id);

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: org, error } = await supabase
    .from("organizations")
    .select("id, name, slug, brand_name, llm_daily_cap, created_at")
    .eq("id", orgId)
    .single();

  if (error || !org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const { data: usage } = await supabase
    .from("org_llm_usage")
    .select("call_count, usage_date")
    .eq("org_id", orgId)
    .eq("usage_date", new Date().toISOString().slice(0, 10))
    .maybeSingle();

  return NextResponse.json({
    organization: org,
    role: membership.role,
    llm_usage_today: usage?.call_count ?? 0,
  });
}
