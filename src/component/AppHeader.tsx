"use client";

import { usePathname } from "next/navigation";

import { UserMenu } from "@/component/UserMenu";
import { getPageTitle } from "@/lib/routes";

export function AppHeader() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="shrink-0 border-b border-border bg-background px-page py-4">
      <div className="flex items-center justify-between py-1">
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        <UserMenu />
      </div>
    </header>
  );
}
