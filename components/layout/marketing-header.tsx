import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { BrandLockup } from "@/components/layout/brand-lockup";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/#features", label: "Features" },
  { href: "/#benchmarks", label: "Benchmarks" },
];

const APP_NAV = [
  { href: "/interviews/new", label: "Mock interview" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/coach", label: "Coach" },
];

export function MarketingHeader({ user }: { user: User | null }) {
  return (
    <header className="nr-marketing-header">
      <div className="nr-marketing-header-inner">
        <div className="flex items-center gap-8">
          <BrandLockup compact href="/" />
          <nav className="hidden items-center gap-6 md:flex">
            {user
              ? APP_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="font-mono text-[13px] font-medium tracking-wide text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))
              : NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="font-mono text-[13px] font-medium tracking-wide text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/interviews/new"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Start session
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" })
                )}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
