"use client";

import { Plug } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { connectSandboxSquare, disconnectSquare } from "@/lib/square/actions";

const CARD_CLASS =
  "w-full overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]";

const CONNECT_BUTTON_CLASS =
  "inline-flex shrink-0 items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition-[background-color,box-shadow] hover:bg-accent-hover hover:shadow disabled:cursor-not-allowed disabled:opacity-50";

const DISCONNECT_BUTTON_CLASS =
  "inline-flex shrink-0 items-center rounded-md border border-border/80 bg-surface px-4 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-error/30 hover:bg-error/5 hover:text-error disabled:cursor-not-allowed disabled:opacity-50";

type SquareConnectBannerProps = {
  connectEnabled: boolean;
  oauthEnabled: boolean;
  sandboxConnectEnabled: boolean;
  connected: boolean;
  merchantId: string | null;
  organizationId: string | null;
};

export function SquareConnectBanner({
  connectEnabled,
  oauthEnabled,
  sandboxConnectEnabled,
  connected,
  merchantId,
  organizationId,
}: SquareConnectBannerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("square_connected") === "1") {
      setMessage("Square connected successfully.");
      setError(null);
      router.replace("/dashboard");
    }

    const squareError = searchParams.get("square_error");
    if (squareError) {
      setError(formatSquareError(squareError));
      setMessage(null);
      router.replace("/dashboard");
    }
  }, [router, searchParams]);

  function handleDisconnect() {
    if (!organizationId) return;

    startTransition(async () => {
      const result = await disconnectSquare(organizationId);
      if ("error" in result) {
        setError(result.error);
        setMessage(null);
        return;
      }

      setMessage("Square disconnected.");
      setError(null);
      router.refresh();
    });
  }

  function handleSandboxConnect() {
    if (!organizationId) return;

    startTransition(async () => {
      const result = await connectSandboxSquare(organizationId);
      if ("error" in result) {
        setError(result.error);
        setMessage(null);
        return;
      }

      setMessage("Square connected using sandbox access token.");
      setError(null);
      router.refresh();
    });
  }

  const canOAuthConnect = oauthEnabled && organizationId != null && !connected;
  const canSandboxConnect =
    sandboxConnectEnabled && organizationId != null && !connected;
  const showMissingOrg =
    connectEnabled && organizationId == null && !connected;

  return (
    <div className={CARD_CLASS}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-surface-muted">
            <Plug className="size-4 text-text-muted" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-text-primary">
              Square
              <span className="font-normal text-text-muted">
                {connected ? " · connected" : " · not connected"}
              </span>
            </p>
            <p className="text-xs text-text-muted">
              {!connectEnabled
                ? "Add Square credentials to .env.local to enable Square."
                : showMissingOrg
                  ? "Select an organization in the sidebar before connecting Square."
                  : connected
                    ? `Merchant ${merchantId ?? "linked"}. Sales data will appear in the charts below.`
                    : canSandboxConnect
                      ? "Connect links your sandbox access token to this organization."
                      : canOAuthConnect
                        ? "Connect Square to import sales and fill in the charts below."
                        : "Add SQUARE_APPLICATION_SECRET to .env.local to enable OAuth connect."}
            </p>
            {message ? <p className="mt-1 text-xs text-success">{message}</p> : null}
            {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
          </div>
        </div>
        {connected ? (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={pending || !organizationId}
            className={DISCONNECT_BUTTON_CLASS}
          >
            {pending ? "Disconnecting…" : "Disconnect"}
          </button>
        ) : canOAuthConnect ? (
          <a href="/api/square/connect" className={CONNECT_BUTTON_CLASS}>
            Connect Square
          </a>
        ) : canSandboxConnect ? (
          <button
            type="button"
            onClick={handleSandboxConnect}
            disabled={pending}
            className={CONNECT_BUTTON_CLASS}
          >
            {pending ? "Connecting…" : "Connect Square"}
          </button>
        ) : (
          <button type="button" disabled className={`${CONNECT_BUTTON_CLASS} opacity-60`}>
            Connect Square
          </button>
        )}
      </div>
    </div>
  );
}

function formatSquareError(code: string): string {
  switch (code) {
    case "invalid_request":
      return "Square connection failed: invalid request.";
    case "invalid_state":
      return "Square connection failed: session expired. Try again.";
    case "no_organization":
      return "Select an organization before connecting Square.";
    case "oauth_not_configured":
      return "OAuth is not configured. Use Connect with your sandbox token or add SQUARE_APPLICATION_SECRET.";
    case "token_exchange":
      return "Square connection failed: could not exchange authorization code.";
    default:
      return `Square connection failed: ${code}`;
  }
}
