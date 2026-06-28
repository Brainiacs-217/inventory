export type Organization = {
  id: string;
  name: string;
  logoSrc?: string;
  logoClassName?: string;
  logoScaleClass?: string;
};

export type CreateOrganizationFormValues = {
  name: string;
  logoSrc: string | null;
};

export function createEmptyOrganizationFormValues(): CreateOrganizationFormValues {
  return { name: "", logoSrc: null };
}
