export const publicPaths = ["/login"] as const;

export type NavIcon =
  | "dashboard"
  | "package"
  | "boxes"
  | "book-open"
  | "warehouse";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/items", label: "Items", icon: "package" },
  { href: "/batches", label: "Batches", icon: "boxes" },
  { href: "/recipes", label: "Recipes", icon: "book-open" },
  { href: "/inventory", label: "Inventory", icon: "warehouse" },
];

function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isAppPath(pathname: string): boolean {
  if (pathname.startsWith("/api")) return false;
  if (isPublicPath(pathname)) return false;
  return navItems.some((item) => matchesPath(pathname, item.href));
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (!matchesPath(pathname, href)) return false;

  return !navItems.some(
    (item) =>
      item.href !== href &&
      item.href.startsWith(`${href}/`) &&
      matchesPath(pathname, item.href),
  );
}

export function getPageTitle(pathname: string): string {
  const match = navItems
    .filter((item) => matchesPath(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Inventory";
}

export type ListRoute = "items" | "batches" | "recipes" | "inventory";

export function getListRoute(href: string): ListRoute | null {
  switch (href) {
    case "/items":
    case "/batches":
    case "/recipes":
    case "/inventory":
      return href.slice(1) as ListRoute;
    default:
      return null;
  }
}
