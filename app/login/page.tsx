import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { getOptionalUser } from "@/lib/auth/get-optional-user";
import { mapSupabaseAuthError } from "@/lib/auth/format-auth-error";

export const metadata = {
  title: "Log in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await getOptionalUser();

  return (
    <MarketingShell user={user}>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        {params.error ? (
          <p className="mb-4 max-w-md text-center text-sm text-destructive" role="alert">
            {mapSupabaseAuthError(decodeURIComponent(params.error))}
          </p>
        ) : null}
        <SupabaseSetupNotice />
        <EmailAuthForm mode="login" next={params.next} />
      </div>
    </MarketingShell>
  );
}
