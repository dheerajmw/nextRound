import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { getOptionalUser } from "@/lib/auth/get-optional-user";

export const metadata = {
  title: "Sign up",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const user = await getOptionalUser();

  return (
    <MarketingShell user={user}>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <SupabaseSetupNotice />
        <EmailAuthForm mode="signup" next={params.next} />
      </div>
    </MarketingShell>
  );
}
