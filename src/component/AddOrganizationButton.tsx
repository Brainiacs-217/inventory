"use client";

import { Plus } from "lucide-react";

type AddOrganizationButtonProps = {
  collapsed?: boolean;
  onClick?: () => void;
};

export function AddOrganizationButton({
  collapsed = false,
  onClick,
}: AddOrganizationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? "Add organization" : undefined}
      className={`flex w-full items-center rounded-md py-2 text-left text-sm text-sidebar-muted transition-colors hover:bg-sidebar-active/50 hover:text-sidebar-foreground ${
        collapsed ? "justify-center px-2" : "gap-2.5 px-3"
      }`}
    >
      <Plus aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2} />
      {!collapsed && <span className="truncate">Add organization</span>}
    </button>
  );
}
