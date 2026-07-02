import { mapOrganizationFromDb } from "@/lib/organizations/mappers";
import { createClient } from "@/lib/supabase/server";
import type { Organization } from "@/types/organization";

export async function getUserOrganizations(): Promise<Organization[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, logo_url")
    .order("name");

  if (error) return [];

  return (data ?? []).map(mapOrganizationFromDb);
}
