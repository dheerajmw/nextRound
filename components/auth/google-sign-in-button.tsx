"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GoogleSignInButton({
  next,
  className,
}: {
  next?: string;
  className?: string;
}) {
  const href = next
    ? `/auth/google?next=${encodeURIComponent(next)}`
    : "/auth/google";

  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant: "outline" }), "w-full", className)}
    >
      Continue with Google
    </Link>
  );
}
