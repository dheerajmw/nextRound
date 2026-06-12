"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

export const INTERVIEW_LEAVE_MESSAGE =
  "Leaving this page will cancel your mock interview. Do you want to continue?";

type InterviewNavigationGuardContextValue = {
  activeSessionId: string | null;
  setActiveSessionId: (sessionId: string | null) => void;
  confirmNavigate: (href: string) => Promise<void>;
};

const InterviewNavigationGuardContext =
  createContext<InterviewNavigationGuardContextValue | null>(null);

function isCurrentOrChildPath(current: string, target: string): boolean {
  if (target === "/") return current === "/";
  return current === target || current.startsWith(`${target}/`);
}

export function InterviewNavigationGuardProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const confirmNavigate = useCallback(
    async (href: string) => {
      if (!activeSessionId) {
        router.push(href);
        return;
      }

      const confirmed = window.confirm(INTERVIEW_LEAVE_MESSAGE);
      if (!confirmed) return;

      try {
        await fetch(`/api/interviews/${activeSessionId}/cancel`, {
          method: "POST",
        });
      } catch {
        // Continue navigation even if cancel fails.
      }

      setActiveSessionId(null);
      router.push(href);
      router.refresh();
    },
    [activeSessionId, router]
  );

  useEffect(() => {
    if (!activeSessionId) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [activeSessionId]);

  const value = useMemo(
    () => ({ activeSessionId, setActiveSessionId, confirmNavigate }),
    [activeSessionId, confirmNavigate]
  );

  return (
    <InterviewNavigationGuardContext.Provider value={value}>
      {children}
    </InterviewNavigationGuardContext.Provider>
  );
}

export function useInterviewNavigationGuard() {
  const context = useContext(InterviewNavigationGuardContext);
  if (!context) {
    throw new Error(
      "useInterviewNavigationGuard must be used within InterviewNavigationGuardProvider"
    );
  }
  return context;
}

export function useOptionalInterviewNavigationGuard() {
  return useContext(InterviewNavigationGuardContext);
}

export function useGuardedNavClick() {
  const pathname = usePathname();
  const guard = useOptionalInterviewNavigationGuard();

  return useCallback(
    async (href: string, event?: MouseEvent<HTMLElement>) => {
      if (!guard?.activeSessionId) return;
      if (isCurrentOrChildPath(pathname, href)) return;

      event?.preventDefault();
      await guard.confirmNavigate(href);
    },
    [guard, pathname]
  );
}
