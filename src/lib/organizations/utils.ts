import type { Organization } from "@/types/organization";

export function getOrganization(
  id: string,
  organizations: Organization[],
): Organization | undefined {
  if (!id) return undefined;
  return organizations.find((org) => org.id === id);
}
