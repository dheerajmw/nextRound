"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandLockup } from "@/components/layout/brand-lockup";
import { StitchIcon } from "@/components/layout/stitch-icon";
import { Button, buttonVariants } from "@/components/ui/button";
import { signOut } from "@/app/auth/actions";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: string; match?: (p: string) => boolean };

const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  {
    href: "/interviews/new",
    label: "Mock interview",
    icon: "videocam",
    match: (p) => p.startsWith("/interviews"),
  },
  { href: "/coach", label: "Career coach", icon: "auto_awesome" },
  { href: "/peer", label: "Peer mock", icon: "groups" },
];

const PARTNER_NAV: NavItem[] = [
  { href: "/org", label: "Partner orgs", icon: "corporate_fare" },
];

function NavLink({ href, label, icon, match }: NavItem) {
  const pathname = usePathname();
  const active = match
    ? match(pathname)
    : href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn("nr-nav-link", active && "nr-nav-link--active")}
    >
      <StitchIcon name={icon} filled={active} size={20} />
      {label}
    </Link>
  );
}

export function AppShell({
  children,
  title,
  userEmail,
  displayName,
}: {
  children: ReactNode;
  title?: string;
  userEmail?: string | null;
  displayName?: string | null;
}) {
  const pathname = usePathname();
  const pageTitle =
    title ??
    (pathname === "/"
      ? "Home"
      : pathname.startsWith("/interviews")
      ? "Mock interview"
      : pathname.startsWith("/org")
        ? "Partners"
        : pathname.startsWith("/coach")
          ? "Career coach"
          : pathname.startsWith("/peer")
            ? "Peer mock"
            : pathname.startsWith("/dashboard")
              ? "Performance dashboard"
              : "nextRound");

  return (
    <div className="min-h-screen bg-background">
      <aside className="nr-app-sidebar">
        <div className="p-6 pt-8">
          <BrandLockup href="/" />
        </div>
        <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
          <span className="nr-nav-section-label">Programs</span>
          {PARTNER_NAV.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="border-t border-border/40 px-4 py-5">
          <Link
            href="/interviews/new"
            className={cn(
              buttonVariants(),
              "w-full justify-center gap-2 font-mono text-[13px] font-semibold tracking-wide"
            )}
          >
            <StitchIcon name="add_circle" size={18} />
            Start session
          </Link>
        </div>
        <div className="border-t border-border/40 px-4 py-3">
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start font-mono text-xs text-muted-foreground"
            >
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <header className="nr-app-topbar">
        <h1 className="nr-headline-md text-xl font-semibold">{pageTitle}</h1>
        <div className="flex items-center gap-4 border-l border-border/40 pl-4">
          <div className="hidden text-right sm:block">
            <p className="font-mono text-[13px] font-medium text-foreground">
              {displayName ?? "Candidate"}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {userEmail ?? ""}
            </p>
          </div>
          <div
            className="flex size-9 items-center justify-center rounded-full border border-border/50 bg-muted font-mono text-xs font-semibold text-primary"
            aria-hidden
          >
            {(displayName ?? userEmail ?? "?").charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="nr-app-main">
        <main className="nr-page-inner py-8 pb-16">{children}</main>
      </div>
    </div>
  );
}
