import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import type { ReactNode } from "react";

export async function AppChrome({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle();
    displayName = profile?.display_name ?? null;
  }

  return (
    <AppShell userEmail={user?.email} displayName={displayName} title={title}>
      {children}
    </AppShell>
  );
}
