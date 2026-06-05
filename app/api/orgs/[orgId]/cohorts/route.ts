import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { requireOrgStaff } from "@/lib/partners/access";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
});

type RouteContext = { params: Promise<{ orgId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { orgId } = await context.params;
  const access = await requireOrgStaff(orgId, auth.user.id);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cohorts")
    .select("id, org_id, name, description, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cohorts: data ?? [] });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { orgId } = await context.params;
  const access = await requireOrgStaff(orgId, auth.user.id);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cohorts")
    .insert({
      org_id: orgId,
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() ?? null,
      created_by: auth.user.id,
    })
    .select("id, org_id, name, description, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create cohort" },
      { status: 500 }
    );
  }

  return NextResponse.json({ cohort: data });
}
