"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  formatAuthError,
  isSupabaseConfigured,
  mapSupabaseAuthError,
  supabaseConfigError,
} from "@/lib/auth/format-auth-error";
import {
  safeAuthenticatedPath,
  signupLandingPath,
} from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeAuthenticatedPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (!isSupabaseConfigured()) {
    return { error: supabaseConfigError() };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: mapSupabaseAuthError(error.message) };
    }
  } catch (error) {
    return { error: formatAuthError(error) };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const next = String(formData.get("next") ?? "").trim();
  const redirectTo = signupLandingPath(next);

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (!isSupabaseConfigured()) {
    return { error: supabaseConfigError() };
  }

  try {
    const { NEXT_PUBLIC_APP_URL } = getPublicEnv();
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: displayName ? { full_name: displayName } : undefined,
      },
    });

    if (error) {
      return { error: mapSupabaseAuthError(error.message) };
    }

    if (!data.session) {
      return {
        success:
          "Account created. Check your email for a confirmation link, then log in.",
      };
    }
  } catch (error) {
    return { error: formatAuthError(error) };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
