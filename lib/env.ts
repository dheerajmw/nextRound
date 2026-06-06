import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const serverSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

function isLocalhostHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isLocalhostUrl(url: string): boolean {
  try {
    return isLocalhostHost(new URL(url).hostname);
  } catch {
    return false;
  }
}

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, "");
}

/** Vercel-provided deployment URL (never localhost). */
function getVercelAppUrl(): string | null {
  if (!process.env.VERCEL) {
    return null;
  }

  if (process.env.VERCEL_ENV === "production") {
    const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (productionUrl) {
      return normalizeOrigin(
        productionUrl.startsWith("http")
          ? productionUrl
          : `https://${productionUrl}`
      );
    }
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return normalizeOrigin(`https://${vercelUrl}`);
  }

  return null;
}

/** Resolve the public app URL for auth redirects (prefers the active request origin). */
export function getAppUrl(origin?: string | null): string {
  if (origin) {
    try {
      const url = new URL(origin);
      if (url.protocol === "http:" || url.protocol === "https:") {
        if (!isLocalhostHost(url.hostname) || !process.env.VERCEL) {
          return url.origin;
        }
      }
    } catch {
      // fall through
    }
  }

  const vercelAppUrl = getVercelAppUrl();
  if (vercelAppUrl) {
    return vercelAppUrl;
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const isStalePreviewUrl = configured?.includes("-projects.vercel.app") ?? false;

  if (configured && !isStalePreviewUrl && !isLocalhostUrl(configured)) {
    return normalizeOrigin(configured);
  }

  if (configured && !process.env.VERCEL) {
    return normalizeOrigin(configured);
  }

  if (origin && isLocalhostUrl(origin)) {
    try {
      return new URL(origin).origin;
    } catch {
      // fall through
    }
  }

  return "http://localhost:3000";
}

/** Canonical URL for auth redirects (OAuth callback, email links). */
export function getAuthAppUrl(origin?: string | null): string {
  const authSiteUrl = process.env.AUTH_SITE_URL?.trim();
  if (authSiteUrl && !isLocalhostUrl(authSiteUrl)) {
    return normalizeOrigin(authSiteUrl);
  }

  return getAppUrl(origin);
}

export function getOAuthCallbackUrl(origin?: string | null, next = "/"): string {
  const callback = new URL("/auth/callback", getAuthAppUrl(origin));
  callback.searchParams.set("next", next);
  return callback.toString();
}

export function getPublicEnv(origin?: string | null): PublicEnv {
  return publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    NEXT_PUBLIC_APP_URL: getAppUrl(origin),
  });
}

export function getServerEnv(): ServerEnv {
  return serverSchema.parse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  });
}

export function hasLlmKeys(): boolean {
  const env = getServerEnv();
  return Boolean(env.GEMINI_API_KEY || env.OPENROUTER_API_KEY);
}
