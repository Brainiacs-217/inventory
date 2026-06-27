export type Organization = {
  id: string;
  name: string;
  logoSrc?: string;
  logoClassName?: string;
  logoScaleClass?: string;
};

export const organizations: Organization[] = [
  {
    id: "breaking-dawn",
    name: "Breaking Dawn",
    logoSrc: "/logos/breaking-dawn-icon.png",
  },
  {
    id: "burgerbots",
    name: "BurgerBots",
    logoSrc: "/logos/burgerbots.png",
    logoClassName: "invert",
    logoScaleClass: "scale-[2]",
  },
];

export const defaultOrganizationId = "breaking-dawn";

export const ORG_STORAGE_KEY = "inventory:selectedOrgId";

export function getOrganization(id: string): Organization | undefined {
  return organizations.find((org) => org.id === id);
}
