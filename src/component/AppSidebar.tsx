"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { NavIcon } from "@/component/NavIcon";
import { OrgSwitcher } from "@/component/OrgSwitcher";
import { isNavItemActive, navItems, type NavItem } from "@/lib/routes";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

const linkClass = (active: boolean, collapsed: boolean, highlighted: boolean) =>
  `relative z-10 flex items-center rounded-md py-2 text-sm transition-colors duration-200 ease-out motion-reduce:transition-none ${
    collapsed ? "justify-center px-2" : "gap-2.5 px-3"
  } ${
    active
      ? `font-semibold text-sidebar-foreground ${highlighted ? "" : "bg-sidebar-active"}`
      : "text-sidebar-muted hover:bg-sidebar-active/50 hover:text-sidebar-foreground"
  }`;

type AppSidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  pendingHref?: string | null;
  onPendingChange?: (href: string, pending: boolean) => void;
};

function NavLinkStatus({
  href,
  onPendingChange,
}: {
  href: string;
  onPendingChange?: (href: string, pending: boolean) => void;
}) {
  const { pending } = useLinkStatus();

  useLayoutEffect(() => {
    onPendingChange?.(href, pending);
  }, [href, onPendingChange, pending]);

  return null;
}

function SidebarLink({
  item,
  active,
  collapsed,
  highlighted,
  onNavigate,
  onPendingChange,
  linkRef,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  highlighted: boolean;
  onNavigate?: () => void;
  onPendingChange?: (href: string, pending: boolean) => void;
  linkRef: (node: HTMLAnchorElement | null) => void;
}) {
  return (
    <Link
      ref={linkRef}
      href={item.href}
      scroll={false}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={linkClass(active, collapsed, highlighted)}
      onNavigate={onNavigate}
    >
      <NavLinkStatus href={item.href} onPendingChange={onPendingChange} />
      <NavIcon icon={item.icon} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function AppSidebar({
  mobileOpen = false,
  onMobileClose,
  pendingHref = null,
  onPendingChange,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [indicator, setIndicator] = useState<{
    top: number;
    height: number;
  } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const iconOnly = collapsed && !mobileOpen;
  const activeHref =
    pendingHref ??
    navItems.find((item) => isNavItemActive(pathname, item.href))?.href ??
    null;

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(width < 48rem)");
    const update = () => setIsNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      const link = activeHref ? linkRefs.current[activeHref] : null;
      if (!link) {
        setIndicator(null);
        return;
      }

      const top = link.offsetTop;
      const height = link.offsetHeight;
      setIndicator((current) =>
        current && current.top === top && current.height === height
          ? current
          : { top, height },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeHref, iconOnly, mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

  return (
    <aside
      className={`nav-drawer flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:w-60 md:shrink-0 md:transition-[width] ${
        iconOnly ? "md:w-16" : "md:w-60"
      }`}
      data-open={mobileOpen ? "true" : "false"}
      inert={isNarrow && !mobileOpen}
      role={mobileOpen ? "dialog" : undefined}
      aria-modal={mobileOpen ? true : undefined}
      aria-label={mobileOpen ? "Navigation" : undefined}
    >
      <OrgSwitcher collapsed={iconOnly} />

      <nav
        className={`flex flex-1 flex-col py-4 ${iconOnly ? "px-2" : "px-3"}`}
      >
        <div ref={listRef} className="relative flex flex-col gap-1">
          {indicator ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 z-0 rounded-md bg-sidebar-active transition-[top,height] duration-300 ease-out motion-reduce:transition-none"
              style={{ top: indicator.top, height: indicator.height }}
            />
          ) : null}
          {navItems.map((item) => {
            const active = pendingHref
              ? item.href === pendingHref
              : isNavItemActive(pathname, item.href);

            return (
              <SidebarLink
                key={item.href}
                item={item}
                active={active}
                collapsed={iconOnly}
                highlighted={indicator != null}
                onNavigate={onMobileClose}
                onPendingChange={onPendingChange}
                linkRef={(node) => {
                  linkRefs.current[item.href] = node;
                }}
              />
            );
          })}
        </div>
      </nav>

      {mobileOpen ? (
        <div className="app-safe-bottom mt-auto border-t border-sidebar-border px-3 py-4 md:hidden">
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="flex w-full items-center justify-end rounded-md px-3 py-2 text-sidebar-muted transition-colors hover:bg-sidebar-active/50 hover:text-sidebar-foreground"
          >
            <ChevronLeft aria-hidden className="size-5 shrink-0" />
          </button>
        </div>
      ) : null}

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
