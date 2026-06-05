import { getDefaultRoleTemplate } from "@/lib/enrichment/defaults";
import { resolveRoleKey } from "@/lib/enrichment/role-key";
import type {
  EnrichmentContext,
  ProfileSkills,
  RoleTemplate,
  RubricWeights,
} from "@/lib/enrichment/types";
import { createClient } from "@/lib/supabase/server";
import type { InterviewMode } from "@/lib/supabase/database.types";
import type { Json } from "@/lib/supabase/database.types";

function parseRoleTemplate(row: {
  role_key: string;
  display_name: string;
  competencies: Json;
  rubric_weights: Json;
  onet_codes: string[] | null;
}): RoleTemplate {
  const weights = row.rubric_weights as RubricWeights;
  const competencies = Array.isArray(row.competencies)
    ? (row.competencies as string[])
    : [];

  return {
    role_key: row.role_key,
    display_name: row.display_name,
    competencies,
    rubric_weights: weights,
    onet_codes: row.onet_codes ?? [],
  };
}

export function parseProfileSkills(raw: Json | null): ProfileSkills | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const items = Array.isArray(obj.items)
    ? obj.items.filter((s): s is string => typeof s === "string")
    : [];
  if (items.length === 0 && !obj.summary) return null;
  return {
    items,
    summary:
      typeof obj.summary === "string" ? obj.summary : undefined,
    extracted_at:
      typeof obj.extracted_at === "string" ? obj.extracted_at : undefined,
  };
}

export async function getRoleTemplate(
  roleKey: string,
  mode: InterviewMode
): Promise<RoleTemplate> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("role_templates")
    .select("role_key, display_name, competencies, rubric_weights, onet_codes")
    .eq("role_key", roleKey)
    .maybeSingle();

  if (data) return parseRoleTemplate(data);

  return getDefaultRoleTemplate(mode);
}

export async function getEnrichmentContext(params: {
  targetRole: string;
  mode: InterviewMode;
  userId?: string;
}): Promise<EnrichmentContext> {
  const role_key = resolveRoleKey(params.targetRole, params.mode);
  const role_template = await getRoleTemplate(role_key, params.mode);

  let skills: ProfileSkills | null = null;

  if (params.userId) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills")
      .eq("user_id", params.userId)
      .maybeSingle();

    skills = parseProfileSkills(profile?.skills ?? null);
  }

  return {
    role_key,
    role_template,
    skills,
    competencies: role_template.competencies,
    rubric_weights: role_template.rubric_weights,
  };
}
