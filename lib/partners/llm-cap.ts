import { createClient } from "@/lib/supabase/server";

export class OrgLlmCapExceededError extends Error {
  constructor(
    message = "Organization daily LLM limit reached",
    public dailyCap?: number
  ) {
    super(message);
    this.name = "OrgLlmCapExceededError";
  }
}

export async function getPrimaryOrgIdForUser(
  userId: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  return data?.org_id ?? null;
}

/** Check and increment org LLM usage; throws if cap exceeded. */
export async function assertOrgLlmBudget(userId?: string): Promise<void> {
  if (!userId) return;

  const orgId = await getPrimaryOrgIdForUser(userId);
  if (!orgId) return;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("increment_org_llm_usage", {
    p_org_id: orgId,
  });

  if (error) {
    console.warn("[partners] increment_org_llm_usage failed", error.message);
    return;
  }

  const result = data as {
    allowed?: boolean;
    daily_cap?: number;
    call_count?: number;
  } | null;

  if (result && result.allowed === false) {
    throw new OrgLlmCapExceededError(
      `Daily LLM limit reached (${result.call_count}/${result.daily_cap})`,
      result.daily_cap
    );
  }
}
