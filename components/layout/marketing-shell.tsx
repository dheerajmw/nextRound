import { MarketingHeader } from "@/components/layout/marketing-header";
import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";

export function MarketingShell({
  children,
  user,
}: {
  children: ReactNode;
  user: User | null;
}) {
  return (
    <div className="nr-marketing-shell flex min-h-full flex-col">
      <div className="nr-atmospheric nr-atmospheric--primary" aria-hidden />
      <div className="nr-atmospheric nr-atmospheric--tertiary" aria-hidden />
      <MarketingHeader user={user} />
      <main className="relative z-[1] flex flex-1 flex-col">{children}</main>
    </div>
  );
}
