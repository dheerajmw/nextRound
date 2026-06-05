import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_AUTHENTICATED_PATH,
  safeAuthenticatedPath,
} from "@/lib/auth/paths";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeAuthenticatedPath(searchParams.get("next"));
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");

  if (oauthError) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", oauthError);
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "auth_callback_missing_code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", error.message);
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  const destination = new URL(next, origin);
  if (
    destination.pathname === DEFAULT_AUTHENTICATED_PATH &&
    !destination.search
  ) {
    destination.searchParams.set("event", "signup");
  }

  return NextResponse.redirect(destination);
}
