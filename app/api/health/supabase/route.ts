import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth/format-auth-error";
import { verifySupabaseConnection } from "@/lib/supabase/verify-connection";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  const status = await verifySupabaseConnection();

  let authProbe: string | null = null;
  if (status.ok && url && key) {
    try {
      const response = await fetch(
        `${url}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "health-check@nextround.invalid",
            password: "invalid-password",
          }),
          cache: "no-store",
        }
      );
      const body = await response.text();
      if (body.toLowerCase().includes("invalid api key")) {
        authProbe = "invalid_api_key";
      } else if (body.toLowerCase().includes("invalid login credentials")) {
        authProbe = "ok";
      } else {
        authProbe = `unexpected_${response.status}`;
      }
    } catch {
      authProbe = "fetch_failed";
    }
  }

  return NextResponse.json({
    configured: isSupabaseConfigured(),
    supabaseHost: url ? new URL(url).hostname : null,
    keyPrefix: key ? `${key.slice(0, 16)}… (${key.length} chars)` : null,
    health: status.ok ? "ok" : "failed",
    message: status.ok ? null : status.message,
    authProbe,
  });
}
