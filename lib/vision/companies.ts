import type { CompanyProfile } from "@/lib/vision/types";
import { createClient } from "@/lib/supabase/server";

export async function listCompanyProfiles(): Promise<CompanyProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_profiles")
    .select(
      "id, slug, name, description, interview_focus, question_pack"
    )
    .order("name");

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    interview_focus: row.interview_focus,
    question_pack: Array.isArray(row.question_pack)
      ? (row.question_pack as string[])
      : [],
  }));
}

export async function getCompanyProfile(
  idOrSlug: string
): Promise<CompanyProfile | null> {
  const supabase = await createClient();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    );

  const query = supabase
    .from("company_profiles")
    .select(
      "id, slug, name, description, interview_focus, question_pack"
    );

  const { data } = isUuid
    ? await query.eq("id", idOrSlug).maybeSingle()
    : await query.eq("slug", idOrSlug).maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description,
    interview_focus: data.interview_focus,
    question_pack: Array.isArray(data.question_pack)
      ? (data.question_pack as string[])
      : [],
  };
}

export function pickCompanyQuestion(
  pack: string[],
  index: number,
  exclude: string[] = []
): string | null {
  const excluded = new Set(exclude.map((q) => q.trim().toLowerCase()));
  const available = pack.filter((q) => !excluded.has(q.trim().toLowerCase()));
  if (available.length === 0) return null;
  return available[index % available.length] ?? available[0];
}
