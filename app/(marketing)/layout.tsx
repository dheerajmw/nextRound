import { MarketingShell } from "@/components/layout/marketing-shell";
import { getOptionalUser } from "@/lib/auth/get-optional-user";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalUser();

  return <MarketingShell user={user}>{children}</MarketingShell>;
}
