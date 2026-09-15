"use server";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type AuthActionResult = {
  error?: string;
};

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Check your environment variables." };
  }

  const supabase = await createClient();

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  // Empty identities means this email is already registered.
  if (data.user?.identities?.length === 0) {
    return {
      error: "An account with this email already exists. Try signing in.",
    };
  }

  // Sign in if signup did not return a session (email confirmation may be off).
  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return { error: signInError.message };
    }
  }

  redirect("/dashboard");
}
