import type { Organization } from "@/lib/organizations";

export function OrgLogo({ org }: { org: Organization }) {
  if (org.logoSrc) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white">
        <img
          src={org.logoSrc}
          alt=""
          width={24}
          height={24}
          className={`h-6 w-6 rounded-md object-contain ${org.logoScaleClass ?? ""} ${org.logoClassName ?? ""}`}
        />
      </span>
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-active text-xs font-semibold text-sidebar-foreground">
      {org.name.charAt(0)}
    </span>
  );
}
