import {
  formatAuthErrorMessage,
  isSupabaseConfigured,
  mapSupabaseAuthError,
  supabaseConfigError,
} from "@/lib/auth/format-auth-error";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/env";

import { safeAuthenticatedPath } from "@/lib/auth/paths";

export async function getGoogleOAuthRedirectUrl(
  nextPath?: string | null,
  origin?: string | null
): Promise<{ url: string } | { error: string }> {
  if (!isSupabaseConfigured()) {
    return { error: supabaseConfigError() };
  }

  const next = safeAuthenticatedPath(nextPath);

  try {
    const appUrl = getAppUrl(origin);
    const supabase = await createClient();
    const callbackUrl = new URL("/auth/callback", appUrl);
    callbackUrl.searchParams.set("next", next);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      return { error: mapSupabaseAuthError(error.message) };
    }

    if (!data.url) {
      return {
        error:
          "Google sign-in URL was not returned. Enable Google under Supabase → Authentication → Providers.",
      };
    }

    return { url: data.url };
  } catch (error) {
    return { error: formatAuthErrorMessage(error) };
  }
}
