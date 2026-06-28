import type { Organization } from "@/types/organization";

export const defaultOrganizationId = "";

export const ORG_STORAGE_KEY = "inventory:selectedOrgId";

export function mapOrganizationFromDb(row: {
  id: string;
  name: string;
  logo_url: string | null;
}): Organization {
  return {
    id: row.id,
    name: row.name,
    ...(row.logo_url ? { logoSrc: row.logo_url } : {}),
  };
}

export function getOrganization(
  id: string,
  organizations: Organization[],
): Organization | undefined {
  if (!id) return undefined;
  return organizations.find((org) => org.id === id);
}
