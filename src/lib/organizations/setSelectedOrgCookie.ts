"use server";

import { cookies } from "next/headers";

import { SELECTED_ORG_COOKIE } from "@/lib/organizations/selectedOrg";

export async function setSelectedOrganizationCookie(
  organizationId: string,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SELECTED_ORG_COOKIE, organizationId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}
