"use server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { mapOrganizationFromDb } from "@/lib/organizations";
import type { Organization } from "@/types/organization";
import type { Tables } from "@/types/database";

type ActionError = { error: string };
type ActionSuccess<T> = { data: T };

export async function createOrganization(
  name: string,
): Promise<ActionError | ActionSuccess<{ org: Tables<"organizations"> }>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Check your environment variables." };
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { error: "Organization name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create an organization." };
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: trimmedName,
      created_by: user.id,
    })
    .select()
    .single();

  if (orgError) {
    return { error: orgError.message };
  }

  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: org.id,
    profile_id: user.id,
    role: "owner",
  });

  if (memberError) {
    return { error: memberError.message };
  }

  return { data: { org } };
}

export async function updateOrganizationLogo(
  orgId: string,
  logoUrl: string,
): Promise<ActionError | Record<string, never>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Check your environment variables." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to update an organization." };
  }

  const { error } = await supabase
    .from("organizations")
    .update({ logo_url: logoUrl })
    .eq("id", orgId);

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function fetchUserOrganizations(): Promise<
  ActionError | ActionSuccess<{ organizations: Organization[] }>
> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Check your environment variables." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: { organizations: [] } };
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, logo_url")
    .order("name");

  if (error) {
    return { error: error.message };
  }

  return {
    data: {
      organizations: (data ?? []).map(mapOrganizationFromDb),
    },
  };
}
