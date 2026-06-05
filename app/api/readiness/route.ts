import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { getReadinessMetrics } from "@/lib/readiness/get-readiness";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const metrics = await getReadinessMetrics(auth.user.id);
  return NextResponse.json(metrics);
}
