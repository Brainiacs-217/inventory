"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { UserMenu } from "@/component/UserMenu";
import { getPageTitle } from "@/lib/routes";

type AppHeaderProps = {
  mobileNavOpen?: boolean;
  onMobileNavOpen?: () => void;
};

export function AppHeader({
  mobileNavOpen = false,
  onMobileNavOpen,
}: AppHeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="shrink-0 border-b border-border bg-background px-3 py-3 md:px-page md:py-4">
      <div className="flex items-center justify-between py-1">
        <div className="flex h-10 items-center gap-2">
          <button
            type="button"
            onClick={onMobileNavOpen}
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            className="flex size-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary md:hidden"
          >
            <Menu className="size-5" strokeWidth={2} />
          </button>
          <h2 className="hidden h-10 items-center text-sm font-semibold text-text-primary md:flex">
            {title}
          </h2>
        </div>
        <div className="flex h-10 items-center">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
