export const publicPaths = ["/login"] as const;

export type NavIcon =
  | "dashboard"
  | "utensils"
  | "package"
  | "book-open"
  | "warehouse";

export type NavChild = {
  href: string;
  label: string;
  icon: NavIcon;
};

export type NavItem = {
  label: string;
  href?: string;
  icon: NavIcon;
  children?: NavChild[];
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  {
    label: "Items and Recipes",
    icon: "utensils",
    children: [
      { href: "/items", label: "Items", icon: "package" },
      { href: "/recipes", label: "Recipes", icon: "book-open" },
    ],
  },
  { href: "/inventory", label: "Inventory", icon: "warehouse" },
];

function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function itemMatchesPath(item: NavItem, pathname: string): boolean {
  if (item.href && matchesPath(pathname, item.href)) return true;
  return (
    item.children?.some((child) => matchesPath(pathname, child.href)) ?? false
  );
}

export function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isAppPath(pathname: string): boolean {
  if (pathname.startsWith("/api")) return false;
  if (isPublicPath(pathname)) return false;
  return navItems.some((item) => itemMatchesPath(item, pathname));
}

export function getPageTitle(pathname: string): string {
  for (const item of navItems) {
    if (item.children) {
      const child = item.children.find((c) => matchesPath(pathname, c.href));
      if (child) return child.label;
    }
    if (item.href && matchesPath(pathname, item.href)) {
      return item.label;
    }
  }
  return "Inventory";
}
