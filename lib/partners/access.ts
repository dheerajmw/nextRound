import type { OrgMemberRole } from "@/lib/partners/types";
import { createClient } from "@/lib/supabase/server";

export async function getOrgMembership(
  orgId: string,
  userId: string
): Promise<{ role: OrgMemberRole } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  return { role: data.role as OrgMemberRole };
}

export async function requireOrgStaff(
  orgId: string,
  userId: string,
  allowed: OrgMemberRole[] = ["admin", "coach"]
): Promise<{ role: OrgMemberRole } | { error: string; status: number }> {
  const membership = await getOrgMembership(orgId, userId);
  if (!membership) {
    return { error: "Not a member of this organization", status: 403 };
  }
  if (!allowed.includes(membership.role)) {
    return { error: "Insufficient permissions", status: 403 };
  }
  return membership;
}

export async function requireOrgAdmin(
  orgId: string,
  userId: string
): Promise<{ role: "admin" } | { error: string; status: number }> {
  const result = await requireOrgStaff(orgId, userId, ["admin"]);
  if ("error" in result) return result;
  return { role: "admin" };
}

export async function getCohortInOrg(
  cohortId: string,
  orgId: string
): Promise<{ id: string; name: string; org_id: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cohorts")
    .select("id, name, org_id")
    .eq("id", cohortId)
    .eq("org_id", orgId)
    .maybeSingle();

  return data;
}

export async function linkPendingInvites(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("link_pending_cohort_members", {
    p_user_id: userId,
  });

  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}

export function slugifyOrgName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const suffix = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${suffix}` : `org-${suffix}`;
}
