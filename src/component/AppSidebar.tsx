"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { NavIcon } from "@/component/NavIcon";
import { OrgSwitcher } from "@/component/OrgSwitcher";
import { navItems, type NavItem } from "@/lib/routes";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupIsActive(item: NavItem, pathname: string): boolean {
  return (
    item.children?.some((child) => isActive(pathname, child.href)) ?? false
  );
}

const linkClass = (active: boolean, collapsed: boolean) =>
  `flex items-center rounded-md py-2 text-sm transition-colors ${
    collapsed ? "justify-center px-2" : "gap-2.5 px-3"
  } ${
    active
      ? "bg-sidebar-active font-semibold text-sidebar-foreground"
      : "text-sidebar-muted hover:bg-sidebar-active/50 hover:text-sidebar-foreground"
  }`;

type AppSidebarProps = {
  mobileOpen?: boolean;
};

export function AppSidebar({ mobileOpen = false }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const iconOnly = collapsed && !mobileOpen;

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      for (const item of navItems) {
        if (item.children && groupIsActive(item, pathname)) {
          next[item.label] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

  function toggleGroup(label: string) {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <aside
      className={`flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:w-60 ${
        mobileOpen ? "max-md:flex" : "max-md:hidden"
      } md:flex md:shrink-0 md:transition-[width] ${
        iconOnly ? "md:w-16" : "md:w-60"
      }`}
      role={mobileOpen ? "dialog" : undefined}
      aria-modal={mobileOpen ? true : undefined}
      aria-label={mobileOpen ? "Navigation" : undefined}
    >
      <OrgSwitcher collapsed={iconOnly} />

      <nav
        className={`flex flex-1 flex-col gap-1 py-4 ${iconOnly ? "px-2" : "px-3"}`}
      >
        {navItems.map((item) => {
          if (item.children) {
            const isExpanded = expanded[item.label] ?? false;

            if (iconOnly) {
              const groupActive = groupIsActive(item, pathname);
              const activeChild = item.children.find((child) =>
                isActive(pathname, child.href),
              );

              return (
                <Link
                  key={item.label}
                  href={activeChild?.href ?? item.children[0].href}
                  title={item.label}
                  className={linkClass(groupActive, iconOnly)}
                >
                  <NavIcon icon={item.icon} />
                </Link>
              );
            }

            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => toggleGroup(item.label)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-active/50 hover:text-sidebar-foreground"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <NavIcon icon={item.icon} />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <ChevronDown
                    aria-hidden
                    className={`h-4 w-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>

                {isExpanded && (
                  <div className="mt-1 flex flex-col gap-1 pl-3">
                    {item.children.map((child) => {
                      const childActive = isActive(pathname, child.href);

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={linkClass(childActive, iconOnly)}
                        >
                          <NavIcon icon={child.icon} />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const active = isActive(pathname, item.href!);

          return (
            <Link
              key={item.href}
              href={item.href!}
              title={iconOnly ? item.label : undefined}
              className={linkClass(active, iconOnly)}
            >
              <NavIcon icon={item.icon} />
              {!iconOnly && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div
        className={`mt-auto hidden border-t border-sidebar-border py-4 md:block ${
          iconOnly ? "px-2" : "px-3"
        }`}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`flex w-full items-center rounded-md py-2 text-sidebar-muted transition-colors hover:bg-sidebar-active/50 hover:text-sidebar-foreground ${
            iconOnly ? "justify-center px-2" : "justify-end px-3"
          }`}
        >
          {iconOnly ? (
            <ChevronRight aria-hidden className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronLeft aria-hidden className="h-4 w-4 shrink-0" />
          )}
        </button>
      </div>
    </aside>
  );
}
