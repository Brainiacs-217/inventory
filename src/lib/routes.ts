export const publicPaths = ["/login"] as const;

export type NavIcon =
  | "dashboard"
  | "package"
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

export function getPageTitle(pathname: string): string {
  const match = navItems.find((item) => matchesPath(pathname, item.href));
  return match?.label ?? "Inventory";
}
