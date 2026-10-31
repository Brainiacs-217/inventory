const PENDING_ORG_DRAFT_KEY = "inventory:pending-org-draft";

export type PendingOrgDraft = {
  name: string;
  logoSrc: string | null;
};

export function savePendingOrgDraft(draft: PendingOrgDraft) {
  try {
    sessionStorage.setItem(PENDING_ORG_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // The Square round trip can still restore the name from the server.
  }
}

export function readPendingOrgDraft(): PendingOrgDraft | null {
  try {
    const raw = sessionStorage.getItem(PENDING_ORG_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingOrgDraft>;
    if (!parsed || typeof parsed.name !== "string") return null;
    return {
      name: parsed.name,
      logoSrc: typeof parsed.logoSrc === "string" ? parsed.logoSrc : null,
    };
  } catch {
    return null;
  }
}

export function clearPendingOrgDraft() {
  sessionStorage.removeItem(PENDING_ORG_DRAFT_KEY);
}
