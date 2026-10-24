"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { AppHeader } from "@/component/AppHeader";
import { AppSidebar } from "@/component/AppSidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      <button
        type="button"
        aria-label="Close navigation"
        aria-hidden={!mobileNavOpen}
        tabIndex={mobileNavOpen ? 0 : -1}
        className={`fixed inset-0 z-40 bg-foreground/25 transition-opacity duration-[240ms] ease-out motion-reduce:transition-none md:hidden ${
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileNavOpen(false)}
      />
      <AppSidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AppHeader
          mobileNavOpen={mobileNavOpen}
          onMobileNavOpen={() => setMobileNavOpen(true)}
        />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background p-3 md:p-page">
          {children}
        </main>
      </div>
    </div>
  );
}
