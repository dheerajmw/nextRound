import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { slugifyOrgName } from "@/lib/partners/access";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  brand_name: z.string().max(120).optional(),
  llm_daily_cap: z.number().int().min(50).max(10000).optional(),
});

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const supabase = await createClient();
  const { data: memberships, error } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orgIds = (memberships ?? []).map((m) => m.org_id);
  if (orgIds.length === 0) {
    return NextResponse.json({ organizations: [] });
  }

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, slug, brand_name, llm_daily_cap, created_at")
    .in("id", orgIds);

  const orgById = new Map((orgs ?? []).map((o) => [o.id, o]));

  return NextResponse.json({
    organizations: (memberships ?? []).map((m) => ({
      role: m.role,
      organization: orgById.get(m.org_id),
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const slug = slugifyOrgName(parsed.data.name);

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: parsed.data.name.trim(),
      slug,
      brand_name: parsed.data.brand_name?.trim() ?? null,
      llm_daily_cap: parsed.data.llm_daily_cap ?? 500,
    })
    .select("id, name, slug, brand_name, llm_daily_cap, created_at")
    .single();

  if (orgError || !org) {
    return NextResponse.json(
      { error: orgError?.message ?? "Failed to create organization" },
      { status: 500 }
    );
  }

  const { error: memberError } = await supabase.from("org_members").insert({
    org_id: org.id,
    user_id: auth.user.id,
    role: "admin",
  });

  if (memberError) {
    await supabase.from("organizations").delete().eq("id", org.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({
    organization: org,
    role: "admin",
  });
}
