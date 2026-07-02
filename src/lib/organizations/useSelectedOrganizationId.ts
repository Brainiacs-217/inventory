"use client";

import { useEffect, useState } from "react";

import { ORG_STORAGE_KEY } from "@/lib/organizations/constants";

export const ORG_CHANGED_EVENT = "inventory:org-changed";

export function notifyOrganizationChanged(): void {
  window.dispatchEvent(new Event(ORG_CHANGED_EVENT));
}

export function useSelectedOrganizationId(): string {
  const [organizationId, setOrganizationId] = useState("");

  useEffect(() => {
    function readOrganizationId() {
      setOrganizationId(localStorage.getItem(ORG_STORAGE_KEY) ?? "");
    }

    readOrganizationId();
    window.addEventListener(ORG_CHANGED_EVENT, readOrganizationId);
    window.addEventListener("storage", readOrganizationId);

    return () => {
      window.removeEventListener(ORG_CHANGED_EVENT, readOrganizationId);
      window.removeEventListener("storage", readOrganizationId);
    };
  }, []);

  return organizationId;
}
