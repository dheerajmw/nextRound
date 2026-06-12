"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { BrandLockup } from "@/components/layout/brand-lockup";
import { StitchIcon } from "@/components/layout/stitch-icon";
import {
  INTERVIEW_LEAVE_MESSAGE,
  InterviewNavigationGuardProvider,
  useGuardedNavClick,
  useOptionalInterviewNavigationGuard,
} from "@/components/interview/interview-navigation-guard";
import { Button, buttonVariants } from "@/components/ui/button";
import { signOut } from "@/app/auth/actions";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  match?: (p: string) => boolean;
};

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

function NavLink({
  href,
  label,
  icon,
  match,
  onNavigate,
}: NavItem & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const guardedNavClick = useGuardedNavClick();
  const active = match
    ? match(pathname)
    : href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={(event) => {
        void guardedNavClick(href, event);
        onNavigate?.();
      }}
      className={cn("nr-nav-link", active && "nr-nav-link--active")}
    >
      <StitchIcon name={icon} filled={active} size={20} />
      {label}
    </Link>
  );
}

function SignOutForm({ className }: { className?: string }) {
  const guard = useOptionalInterviewNavigationGuard();
  const signOutAfterCancelRef = useRef(false);

  return (
    <form
      action={signOut}
      className={className}
      onSubmit={async (event: FormEvent<HTMLFormElement>) => {
        if (signOutAfterCancelRef.current) {
          signOutAfterCancelRef.current = false;
          return;
        }

        if (!guard?.activeSessionId) return;

        event.preventDefault();
        const confirmed = window.confirm(INTERVIEW_LEAVE_MESSAGE);
        if (!confirmed) return;

        try {
          await fetch(`/api/interviews/${guard.activeSessionId}/cancel`, {
            method: "POST",
          });
        } catch {
          // Continue sign-out even if cancel fails.
        }

        guard.setActiveSessionId(null);
        signOutAfterCancelRef.current = true;
        event.currentTarget.requestSubmit();
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="w-full justify-start font-mono text-xs text-muted-foreground"
      >
        Sign out
      </Button>
    </form>
  );
}

function StartSessionLink({ onNavigate }: { onNavigate?: () => void }) {
  const guardedNavClick = useGuardedNavClick();

  return (
    <Link
      href="/interviews/new"
      onClick={(event) => {
        void guardedNavClick("/interviews/new", event);
        onNavigate?.();
      }}
      className={cn(
        buttonVariants(),
        "w-full justify-center gap-2 font-mono text-[13px] font-semibold tracking-wide"
      )}
    >
      <StitchIcon name="add_circle" size={18} />
      Start session
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} {...item} onNavigate={onNavigate} />
        ))}
        <span className="nr-nav-section-label">Programs</span>
        {PARTNER_NAV.map((item) => (
          <NavLink key={item.href} {...item} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="border-t border-border/40 px-4 py-5">
        <StartSessionLink onNavigate={onNavigate} />
      </div>
      <div className="border-t border-border/40 px-4 py-3">
        <SignOutForm />
      </div>
    </>
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
  return (
    <InterviewNavigationGuardProvider>
      <AppShellInner
        title={title}
        userEmail={userEmail}
        displayName={displayName}
      >
        {children}
      </AppShellInner>
    </InterviewNavigationGuardProvider>
  );
}

function AppShellInner({
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
  const guardedNavClick = useGuardedNavClick();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="nr-app-sidebar">
        <div className="p-6 pt-8">
          <BrandLockup
            href="/"
            onNavigate={(event) => guardedNavClick("/", event)}
          />
        </div>
        <SidebarNav />
      </aside>

      <header className="nr-app-topbar">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex min-w-0 items-center gap-1 lg:hidden">
            <BrandLockup
              compact
              href="/"
              className="shrink-0"
              onNavigate={(event) => guardedNavClick("/", event)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              aria-expanded={mobileNavOpen}
              aria-controls="app-mobile-nav"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              <StitchIcon
                name={mobileNavOpen ? "close" : "menu"}
                size={22}
              />
            </Button>
          </div>
          <h1 className="nr-headline-md hidden min-w-0 truncate lg:block">
            {pageTitle}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:border-l lg:border-border/40 lg:pl-4">
          <Link
            href="/interviews/new"
            onClick={(event) => guardedNavClick("/interviews/new", event)}
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-1.5 font-mono text-xs font-semibold lg:hidden"
            )}
          >
            <StitchIcon name="add_circle" size={16} />
            <span className="hidden min-[400px]:inline">Start</span>
          </Link>
          <div className="hidden text-right md:block">
            <p className="max-w-[140px] truncate font-mono text-[13px] font-medium text-foreground">
              {displayName ?? "Candidate"}
            </p>
            <p className="max-w-[140px] truncate font-mono text-[11px] text-muted-foreground">
              {userEmail ?? ""}
            </p>
          </div>
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/50 bg-muted font-mono text-xs font-semibold text-primary sm:size-9"
            aria-hidden
          >
            {(displayName ?? userEmail ?? "?").charAt(0).toUpperCase()}
          </div>
        </div>

        {mobileNavOpen ? (
          <nav
            id="app-mobile-nav"
            className="nr-app-mobile-nav fixed inset-x-0 top-[var(--nr-header-height)] z-40 flex flex-col lg:hidden"
            aria-label="Mobile navigation"
          >
            <SidebarNav onNavigate={closeMobileNav} />
          </nav>
        ) : null}
      </header>

      <div className="nr-app-main">
        <main className="nr-page-inner py-6 pb-20 sm:py-8 sm:pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
