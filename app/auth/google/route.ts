import { NextResponse } from "next/server";
import { getGoogleOAuthRedirectUrl } from "@/lib/auth/google-oauth";

/**
 * Starts Google OAuth via a full HTTP redirect (avoids blank screen from
 * server-action form posts to external URLs).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next");

  const result = await getGoogleOAuthRedirectUrl(next);

  if ("url" in result) {
    return NextResponse.redirect(result.url);
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", result.error);
  if (next) {
    loginUrl.searchParams.set("next", next);
  }

  return NextResponse.redirect(loginUrl);
}
