import { AuthTracker } from "@/components/analytics/auth-tracker";
import { AcceptCohortInvites } from "@/components/partners/accept-cohort-invites";
import { LandingPage } from "@/components/marketing/landing-page";
import { getOptionalUser } from "@/lib/auth/get-optional-user";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const params = await searchParams;
  const user = await getOptionalUser();

  let displayName: string | null = null;
  if (user) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle();
    displayName = profile?.display_name ?? null;
  }

  const analyticsEvent =
    params.event === "signup" ? ("signup" as const) : ("login" as const);

  return (
    <>
      {user ? (
        <>
          <AuthTracker
            userId={user.id}
            email={user.email}
            event={analyticsEvent}
          />
          <AcceptCohortInvites />
        </>
      ) : null}
      <LandingPage user={user} displayName={displayName} />
    </>
  );
}
