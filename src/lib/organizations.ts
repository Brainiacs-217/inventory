import type { Organization } from "@/types/organization";

export const organizations: Organization[] = [];

export const defaultOrganizationId = "";

export const ORG_STORAGE_KEY = "inventory:selectedOrgId";

export function getOrganization(id: string): Organization | undefined {
  if (!id) return undefined;
  return organizations.find((org) => org.id === id);
}
