import {
  isSupabaseConfigured,
  supabaseConfigError,
} from "@/lib/auth/format-auth-error";

export type SupabaseConnectionStatus =
  | { ok: true }
  | { ok: false; message: string };

export async function verifySupabaseConnection(): Promise<SupabaseConnectionStatus> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: supabaseConfigError() };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });

    if (response.ok) {
      return { ok: true };
    }

    const body = await response.text();
    if (body.toLowerCase().includes("invalid api key")) {
      return {
        ok: false,
        message:
          "Supabase rejected the API key loaded by this server. " +
          "Update NEXT_PUBLIC_SUPABASE_ANON_KEY (Publishable sb_publishable_… or Legacy anon eyJ…) " +
          "so it matches NEXT_PUBLIC_SUPABASE_URL, then restart npm run dev. " +
          "On Vercel: set env vars for Production and redeploy.",
      };
    }

    return {
      ok: false,
      message: `Supabase health check failed (HTTP ${response.status}).`,
    };
  } catch {
    return {
      ok: false,
      message:
        "Could not reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL and your network connection.",
    };
  }
}
