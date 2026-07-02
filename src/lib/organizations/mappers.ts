import type { Organization } from "@/types/organization";

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
