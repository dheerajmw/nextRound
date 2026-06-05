import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { computeUserBenchmark } from "@/lib/vision/benchmark";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  try {
    const benchmark = await computeUserBenchmark(auth.user.id);
    return NextResponse.json({ benchmark });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Benchmark failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
