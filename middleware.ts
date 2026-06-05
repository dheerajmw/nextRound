import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/paths";
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/interviews",
  "/org",
  "/peer",
  "/coach",
];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if ((pathname === "/login" || pathname === "/signup") && user) {
    const next = request.nextUrl.searchParams.get("next");
    if (next?.startsWith("/") && !next.startsWith("//")) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_PATH, request.url));
  }

  if (pathname === "/home") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
