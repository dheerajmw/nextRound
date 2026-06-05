import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { listCompanyProfiles } from "@/lib/vision/companies";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const companies = await listCompanyProfiles();
  return NextResponse.json({ companies });
}
