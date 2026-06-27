"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { AddOrganizationButton } from "@/component/AddOrganizationButton";
import { OrgLogo } from "@/component/OrgLogo";
import {
  defaultOrganizationId,
  getOrganization,
  ORG_STORAGE_KEY,
  organizations,
} from "@/lib/organizations";

export function OrgSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(defaultOrganizationId);

  useEffect(() => {
    const stored = localStorage.getItem(ORG_STORAGE_KEY);
    if (stored && getOrganization(stored)) {
      setSelectedId(stored);
    }
  }, []);

  const selected =
    getOrganization(selectedId) ?? getOrganization(defaultOrganizationId)!;

  function selectOrg(id: string) {
    setSelectedId(id);
    localStorage.setItem(ORG_STORAGE_KEY, id);
  }

  return (
    <div
      className={`border-b border-sidebar-border py-4 ${collapsed ? "px-2" : "px-3"}`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={collapsed ? selected.name : undefined}
        className={`flex w-full items-center rounded-md py-2 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-active/50 ${
          collapsed ? "justify-center px-2" : "justify-between gap-2.5 px-3"
        }`}
      >
        <span
          className={`flex min-w-0 items-center ${collapsed ? "" : "gap-2.5"}`}
        >
          <OrgLogo org={selected} />
          {!collapsed && <span className="truncate">{selected.name}</span>}
        </span>
        {!collapsed && (
          <ChevronDown
            aria-hidden
            className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Organizations"
          className={`mt-1 flex flex-col gap-1 ${collapsed ? "" : "pl-3"}`}
        >
          {organizations.map((org) => {
            const isSelected = org.id === selectedId;

            return (
              <li key={org.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => selectOrg(org.id)}
                  title={collapsed ? org.name : undefined}
                  className={`flex w-full items-center rounded-md py-2 text-left text-sm transition-colors ${
                    collapsed ? "justify-center px-2" : "gap-2.5 px-3"
                  } ${
                    isSelected
                      ? "bg-sidebar-active font-semibold text-sidebar-foreground"
                      : "text-sidebar-muted hover:bg-sidebar-active/50 hover:text-sidebar-foreground"
                  }`}
                >
                  <OrgLogo org={org} />
                  {!collapsed && <span className="truncate">{org.name}</span>}
                </button>
              </li>
            );
          })}
          <li>
            <AddOrganizationButton collapsed={collapsed} />
          </li>
        </ul>
      )}
    </div>
  );
}
