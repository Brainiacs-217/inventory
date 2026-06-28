import { cookies } from "next/headers";

export const SELECTED_ORG_COOKIE = "inventory:selectedOrgId";

export async function getSelectedOrganizationId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SELECTED_ORG_COOKIE)?.value ?? null;
}
