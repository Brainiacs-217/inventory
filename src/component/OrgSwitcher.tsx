"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AddOrganizationButton } from "@/component/AddOrganizationButton";
import {
  CreateOrganizationModal,
  type CreateOrganizationResume,
} from "@/component/CreateOrganizationModal";
import { OrgLogo } from "@/component/OrgLogo";
import {
  createOrganization,
  fetchUserOrganizations,
  updateOrganizationLogo,
} from "@/lib/organizations/actions";
import {
  getOrganizationSquareStatus,
  getSquareConnectOptions,
  type SquareConnectOptions,
} from "@/lib/square/actions";
import { formatSquareOAuthError } from "@/lib/square/constants";
import { setSelectedOrganizationCookie } from "@/lib/organizations/setSelectedOrgCookie";
import { uploadOrgLogo } from "@/lib/organizations/storage";
import {
  defaultOrganizationId,
  ORG_STORAGE_KEY,
} from "@/lib/organizations/constants";
import { getOrganization } from "@/lib/organizations/utils";
import { notifyOrganizationChanged } from "@/lib/organizations/useSelectedOrganizationId";
import type { CreateOrganizationFormValues } from "@/types/organization";
import type { Organization } from "@/types/organization";

export function OrgSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedId, setSelectedId] = useState(defaultOrganizationId);
  const [loading, setLoading] = useState(true);
  const [squareOptions, setSquareOptions] = useState<SquareConnectOptions | null>(
    null,
  );
  const [createResume, setCreateResume] = useState<CreateOrganizationResume | null>(
    null,
  );
  const resumedCreateOrg = useRef(false);

  const refreshOrganizations = useCallback(async () => {
    const result = await fetchUserOrganizations();
    if ("error" in result) {
      console.error(result.error);
      return [];
    }
    const orgs = result.data.organizations;
    setOrganizations(orgs);
    return orgs;
  }, []);

  useEffect(() => {
    if (loading || resumedCreateOrg.current) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("resume_create_org") !== "1") return;

    const org =
      organizations.find((item) => item.id === selectedId) ?? organizations[0];
    if (!org) return;

    resumedCreateOrg.current = true;
    const squareError = params.get("square_error");
    const markedConnected = params.get("square_connected") === "1";

    void getOrganizationSquareStatus(org.id).then((status) => {
      setCreateResume({
        organizationId: org.id,
        name: org.name,
        logoSrc: org.logoSrc,
        squareConnected: markedConnected || status.connected,
        merchantId: status.merchantId,
        squareError: squareError ? formatSquareOAuthError(squareError) : null,
      });
      setCreateOpen(true);

      params.delete("resume_create_org");
      params.delete("square_connected");
      params.delete("square_error");
      const next = params.toString();
      router.replace(next ? `${window.location.pathname}?${next}` : window.location.pathname);
    });
  }, [loading, organizations, router, selectedId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const orgs = await refreshOrganizations();
      if (cancelled) return;

      const stored = localStorage.getItem(ORG_STORAGE_KEY);
      if (stored && orgs.some((org) => org.id === stored)) {
        setSelectedId(stored);
        await setSelectedOrganizationCookie(stored);
        router.refresh();
      } else if (orgs.length === 1) {
        setSelectedId(orgs[0].id);
        localStorage.setItem(ORG_STORAGE_KEY, orgs[0].id);
        await setSelectedOrganizationCookie(orgs[0].id);
        notifyOrganizationChanged();
        router.refresh();
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshOrganizations, router]);

  useEffect(() => {
    let cancelled = false;

    getSquareConnectOptions()
      .then((options) => {
        if (!cancelled) setSquareOptions(options);
      })
      .catch(() => {
        if (!cancelled) {
          setSquareOptions({ oauthEnabled: false, sandboxConnectEnabled: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selected = getOrganization(selectedId, organizations);

  async function selectOrg(id: string) {
    setSelectedId(id);
    localStorage.setItem(ORG_STORAGE_KEY, id);
    await setSelectedOrganizationCookie(id);
    notifyOrganizationChanged();
    setOpen(false);
    router.refresh();
  }

  async function handleCreateOrganization(
    values: CreateOrganizationFormValues,
  ): Promise<{ organizationId: string }> {
    const result = await createOrganization(values.name.trim());
    if ("error" in result) {
      throw new Error(result.error);
    }

    const org = result.data.org;

    if (values.logoFile) {
      await handleAttachLogo(org.id, values.logoFile);
    }

    const orgs = await refreshOrganizations();
    await selectOrg(org.id);

    if (orgs.length === 0) {
      throw new Error("Organization was created but could not be loaded.");
    }

    return { organizationId: org.id };
  }

  async function handleAttachLogo(organizationId: string, file: File) {
    const logoUrl = await uploadOrgLogo(organizationId, file);
    const updateResult = await updateOrganizationLogo(organizationId, logoUrl);
    if ("error" in updateResult) {
      throw new Error(updateResult.error);
    }
    await refreshOrganizations();
  }

  return (
    <div
      className={`shrink-0 border-b border-sidebar-border py-3 md:py-4 ${collapsed ? "px-2" : "px-3"}`}
    >
      <div className="flex items-center py-1">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="listbox"
          title={collapsed ? (selected?.name ?? "Organizations") : undefined}
          className={`flex h-10 w-full items-center rounded-md text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-active/50 ${
            collapsed ? "justify-center px-2" : "justify-between gap-2.5 px-3"
          }`}
        >
          <span
            className={`flex min-w-0 items-center ${collapsed ? "" : "gap-2.5"}`}
          >
            {loading ? (
              <>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-active text-xs font-semibold text-sidebar-muted">
                  …
                </span>
                {!collapsed && (
                  <span className="truncate text-sidebar-muted">Loading…</span>
                )}
              </>
            ) : selected ? (
              <>
                <OrgLogo org={selected} />
                {!collapsed && <span className="truncate">{selected.name}</span>}
              </>
            ) : (
              <>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-active text-xs font-semibold text-sidebar-muted">
                  —
                </span>
                {!collapsed && (
                  <span className="truncate text-sidebar-muted">No organization</span>
                )}
              </>
            )}
          </span>
          {!collapsed && (
            <ChevronDown
              aria-hidden
              className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            />
          )}
        </button>
      </div>

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
            <AddOrganizationButton
              collapsed={collapsed}
              onClick={() => setCreateOpen(true)}
            />
          </li>
        </ul>
      )}

      <CreateOrganizationModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateResume(null);
        }}
        onSave={handleCreateOrganization}
        onAttachLogo={handleAttachLogo}
        squareOptions={squareOptions}
        resume={createResume}
      />
    </div>
  );
}
