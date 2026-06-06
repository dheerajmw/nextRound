import { AppChrome } from "@/components/layout/app-chrome";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { getOptionalUser } from "@/lib/auth/get-optional-user";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalUser();

  if (user) {
    return <AppChrome title="Home">{children}</AppChrome>;
  }

  return <MarketingShell user={null}>{children}</MarketingShell>;
}
