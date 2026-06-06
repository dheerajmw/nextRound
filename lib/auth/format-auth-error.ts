const PLACEHOLDER_URL_MARKERS = ["your-project", "your_project", "YOUR_PROJECT"];
const PLACEHOLDER_KEY_MARKERS = [
  "your-anon",
  "your-anon-or-publishable",
  "placeholder-anon-key",
  "your-anon-key",
];

export function isSupabaseConfigured(): boolean {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  if (!url || !key) return false;

  const urlLower = url.toLowerCase();
  const keyLower = key.toLowerCase();

  if (PLACEHOLDER_URL_MARKERS.some((marker) => urlLower.includes(marker))) {
    return false;
  }

  if (PLACEHOLDER_KEY_MARKERS.some((marker) => keyLower.includes(marker))) {
    return false;
  }

  return true;
}

export function supabaseConfigError(): string {
  return (
    "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
    "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to your project values " +
    "(Supabase → Project Settings → API), then restart npm run dev."
  );
}

/** Turn Supabase Auth API errors into actionable copy for the UI. */
export function mapSupabaseAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("email rate limit")) {
    return (
      "Supabase email rate limit reached (free tier sends few confirmation emails per hour). " +
      "For local dev: Dashboard → Authentication → Providers → Email → disable \"Confirm email\", " +
      "then sign up again (no email is sent). Or wait ~1 hour, use Continue with Google, " +
      "or set up custom SMTP under Authentication → Emails."
    );
  }

  if (lower.includes("user already registered")) {
    return "An account with this email already exists. Try logging in instead.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }

  if (lower.includes("invalid api key")) {
    return (
      "Supabase rejected the API key. Fix NEXT_PUBLIC_SUPABASE_ANON_KEY so it matches " +
      "NEXT_PUBLIC_SUPABASE_URL (Supabase → Settings → API). " +
      "Use the Legacy anon key (eyJ…) if the publishable key fails. " +
      "On Vercel: set env vars for Production and Preview, set NEXT_PUBLIC_APP_URL to " +
      "https://next-round-zeta.vercel.app (not localhost), then redeploy. " +
      "Local: run npm run check:env and restart npm run dev."
    );
  }

  if (
    lower.includes("redirect") &&
    (lower.includes("localhost") || lower.includes("not allowed"))
  ) {
    return (
      "Sign-in redirect URL mismatch. In Supabase → Authentication → URL Configuration, " +
      "set Site URL to your production app (e.g. https://next-round-zeta.vercel.app) and add " +
      "https://next-round-zeta.vercel.app/auth/callback to Redirect URLs."
    );
  }

  return message;
}

export function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: string }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function formatAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause;
    const hostname =
      cause &&
      typeof cause === "object" &&
      "hostname" in cause &&
      typeof (cause as { hostname?: string }).hostname === "string"
        ? (cause as { hostname: string }).hostname
        : null;

    if (
      error.message.includes("fetch failed") ||
      error.message.includes("ENOTFOUND")
    ) {
      if (hostname?.includes("your-project")) {
        return supabaseConfigError();
      }
      return (
        "Could not reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL in " +
        ".env.local and your network connection, then restart the dev server."
      );
    }

    return mapSupabaseAuthError(error.message);
  }

  return "Something went wrong. Please try again.";
}

/** Re-throws Next.js redirect errors; use in server actions only. */
export function formatAuthError(error: unknown): string {
  if (isRedirectError(error)) {
    throw error;
  }
  return formatAuthErrorMessage(error);
}
