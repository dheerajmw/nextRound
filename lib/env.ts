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

/** Resolve the public app URL for auth redirects (prefers the active request origin). */
export function getAppUrl(origin?: string | null): string {
  if (origin) {
    try {
      const url = new URL(origin);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.origin;
      }
    } catch {
      // fall through
    }
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const isStalePreviewUrl = configured?.includes("-projects.vercel.app") ?? false;

  if (process.env.VERCEL_ENV === "production") {
    const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (productionUrl) {
      return productionUrl.startsWith("http")
        ? productionUrl.replace(/\/$/, "")
        : `https://${productionUrl.replace(/\/$/, "")}`;
    }
  }

  if (configured && !isStalePreviewUrl) {
    return configured.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return "http://localhost:3000";
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
