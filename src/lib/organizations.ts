import type { Organization } from "@/types/organization";

export const defaultOrganizationId = "";

export const ORG_STORAGE_KEY = "inventory:selectedOrgId";
export const ORGS_LIST_STORAGE_KEY = "inventory:organizations";

export function loadOrganizations(): Organization[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(ORGS_LIST_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Organization[];
  } catch {
    return [];
  }
}

export function saveOrganizations(organizations: Organization[]): void {
  localStorage.setItem(ORGS_LIST_STORAGE_KEY, JSON.stringify(organizations));
}

export function getOrganization(
  id: string,
  organizations: Organization[],
): Organization | undefined {
  if (!id) return undefined;
  return organizations.find((org) => org.id === id);
}
