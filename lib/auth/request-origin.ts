import { headers } from "next/headers";

/** Origin of the incoming request (works on Vercel and local dev). */
export async function getRequestOrigin(): Promise<string | null> {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) {
    return null;
  }

  const proto =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");

  return `${proto}://${host}`;
}
