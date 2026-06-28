"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

const DEV_USER_EMAIL = "dev@local.test";

function getInitials(email: string | undefined): string {
  if (!email) return "U";
  const local = email.split("@")[0] ?? "";
  if (!local) return "U";
  return local.charAt(0).toUpperCase();
}

function getAvatarUrl(metadata: Record<string, unknown> | undefined): string | null {
  if (!metadata) return null;

  const url = metadata.avatar_url ?? metadata.picture;
  return typeof url === "string" && url.length > 0 ? url : null;
}

export function UserMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setEmail(DEV_USER_EMAIL);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
      setAvatarUrl(getAvatarUrl(user?.user_metadata));
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);

    if (!isSupabaseConfigured()) {
      router.push("/login");
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = getInitials(email ?? undefined);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-xs font-semibold text-text-secondary transition-colors hover:bg-border"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Account menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-background p-4 shadow-lg"
        >
          <div className="mb-4 border-b border-border pb-4">
            <p className="text-sm font-semibold text-text-primary">Account</p>
            {email && (
              <p className="mt-1 truncate text-sm text-text-secondary">
                {email}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
          >
            <LogOut aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
