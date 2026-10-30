"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { AppHeader } from "@/component/AppHeader";
import { AppSidebar } from "@/component/AppSidebar";
import { RouteLoading } from "@/component/RouteLoading";
import { getListRoute } from "@/lib/routes";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const handlePendingChange = useCallback((href: string, pending: boolean) => {
    setPendingHref((current) => {
      if (pending) return href;
      return current === href ? null : current;
    });
  }, []);

  const navigatingAway = pendingHref != null && pendingHref !== pathname;
  const loadingKind = navigatingAway ? getListRoute(pendingHref) : null;

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-white">
      <AppSidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        pendingHref={pendingHref}
        onPendingChange={handlePendingChange}
      />
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <AppHeader
          path={pendingHref ?? pathname}
          mobileNavOpen={mobileNavOpen}
          onMobileNavOpen={() => setMobileNavOpen(true)}
        />
        <button
          type="button"
          aria-label="Close navigation"
          aria-hidden={!mobileNavOpen}
          tabIndex={mobileNavOpen ? 0 : -1}
          className={`absolute inset-0 z-40 bg-foreground/25 transition-opacity duration-[240ms] ease-out motion-reduce:transition-none md:hidden ${
            mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setMobileNavOpen(false)}
        />
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
          <div
            inert={loadingKind != null}
            aria-hidden={loadingKind != null}
            className={`flex min-h-0 flex-1 flex-col overflow-hidden p-3 transition-opacity duration-200 ease-out motion-reduce:transition-none md:p-page ${
              loadingKind != null
                ? "invisible"
                : navigatingAway
                  ? "opacity-60"
                  : "opacity-100"
            }`}
          >
            {children}
          </div>
          {loadingKind ? (
            <div className="absolute inset-0 flex min-h-0 flex-col overflow-hidden p-3 md:p-page">
              <RouteLoading route={loadingKind} />
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
