"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BrandLockup } from "@/components/layout/brand-lockup";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { signInWithEmail, signUpWithEmail } from "@/app/auth/actions";

type AuthMode = "login" | "signup";

type FormState = { error?: string; success?: string } | undefined;

const initialState: FormState = undefined;

export function EmailAuthForm({
  mode,
  next,
}: {
  mode: AuthMode;
  next?: string;
}) {
  const action = mode === "login" ? signInWithEmail : signUpWithEmail;
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      try {
        const result = await action(formData);
        return result ?? undefined;
      } catch (error) {
        const { formatAuthError } = await import("@/lib/auth/format-auth-error");
        return { error: formatAuthError(error) };
      }
    },
    initialState
  );

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="flex justify-center">
        <BrandLockup href="/" />
      </div>
      <Card className="w-full">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Welcome back" : "Create account"}</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Sign in to access your interview readiness dashboard."
            : "Start practicing with AI-powered mock interviews."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-4">
          {next ? <input type="hidden" name="next" value={next} /> : null}
          {mode === "signup" ? (
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="Alex"
                autoComplete="name"
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </div>
          {state?.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          {state?.success ? (
            <p className="text-sm text-primary" role="status">
              {state.success}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Sign up"}
          </Button>
        </form>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        <GoogleSignInButton next={next} />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link href="/signup" className="text-foreground underline-offset-4 hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
              Log in
            </Link>
          </>
        )}
      </CardFooter>
    </Card>
    </div>
  );
}
