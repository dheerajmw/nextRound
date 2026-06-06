import { NextResponse } from "next/server";
import {
  DEFAULT_AUTHENTICATED_PATH,
  safeAuthenticatedPath,
} from "@/lib/auth/paths";
import { getRequestOrigin } from "@/lib/auth/request-origin";
import { getAuthAppUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeAuthenticatedPath(searchParams.get("next"));
  const oauthError =
    searchParams.get("error_description") ?? searchParams.get("error");

  const requestOrigin = await getRequestOrigin();
  const appUrl = getAuthAppUrl(requestOrigin);

  if (oauthError) {
    const loginUrl = new URL("/login", appUrl);
    loginUrl.searchParams.set("error", oauthError);
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL("/login", appUrl);
    loginUrl.searchParams.set("error", "auth_callback_missing_code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/login", appUrl);
    loginUrl.searchParams.set("error", error.message);
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  const destination = new URL(next, appUrl);
  if (
    destination.pathname === DEFAULT_AUTHENTICATED_PATH &&
    !destination.search
  ) {
    destination.searchParams.set("event", "signup");
  }

  return NextResponse.redirect(destination);
}
