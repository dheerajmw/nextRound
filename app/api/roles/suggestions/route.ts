import { NextResponse } from "next/server";
import { isMissingTableError } from "@/lib/db/schema-errors";
import { filterRoleSuggestions } from "@/lib/interview/role-suggestions";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("role_templates")
    .select("display_name")
    .order("display_name", { ascending: true });

  const fromDb =
    error && isMissingTableError(error)
      ? []
      : (data ?? []).map((row) => row.display_name);

  const suggestions = filterRoleSuggestions(q, fromDb, 10);

  return NextResponse.json({ suggestions });
}
