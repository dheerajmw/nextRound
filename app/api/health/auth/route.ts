import { NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/auth/request-origin";
import {
  getAppUrl,
  getAuthAppUrl,
  getOAuthCallbackUrl,
} from "@/lib/env";

export async function GET() {
  const requestOrigin = await getRequestOrigin();
  const appUrl = getAppUrl(requestOrigin);
  const authAppUrl = getAuthAppUrl(requestOrigin);
  const oauthCallbackUrl = getOAuthCallbackUrl(requestOrigin, "/dashboard");

  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? null;
  const authSiteUrl = process.env.AUTH_SITE_URL?.trim() ?? null;

  return NextResponse.json({
    requestOrigin,
    appUrl,
    authAppUrl,
    oauthCallbackUrl,
    env: {
      vercel: Boolean(process.env.VERCEL),
      vercelEnv: process.env.VERCEL_ENV ?? null,
      vercelUrl: process.env.VERCEL_URL ?? null,
      vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL ?? null,
      nextPublicAppUrl: configuredAppUrl,
      authSiteUrl,
      nextPublicAppUrlIsLocalhost:
        configuredAppUrl?.includes("localhost") ?? false,
    },
    supabaseDashboard: {
      siteUrl: authAppUrl,
      redirectUrls: [oauthCallbackUrl, `${authAppUrl}/auth/callback`],
      note:
        "In Supabase → Authentication → URL Configuration, Site URL must NOT be localhost for production.",
    },
  });
}
