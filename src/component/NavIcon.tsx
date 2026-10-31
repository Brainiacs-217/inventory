"use client";

import {
  BookOpen,
  Boxes,
  LayoutDashboard,
  Package,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import type { NavIcon } from "@/lib/routes";

const navIcons: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  package: Package,
  boxes: Boxes,
  "book-open": BookOpen,
  warehouse: Warehouse,
};

export function NavIcon({ icon }: { icon: NavIcon }) {
  const Icon = navIcons[icon];

  return <Icon aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2} />;
}
