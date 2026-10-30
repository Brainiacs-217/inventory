/** OAuth scopes requested when a merchant connects Square. */
export const SQUARE_OAUTH_SCOPES = [
  "MERCHANT_PROFILE_READ",
  "ORDERS_READ",
  "ITEMS_READ",
] as const;

export const SQUARE_OAUTH_STATE_COOKIE = "square_oauth_state";

/** Organization that started the OAuth redirect. The callback saves tokens to this org. */
export const SQUARE_OAUTH_ORG_COOKIE = "square_oauth_org";

/** Where to send the user after Square redirects back. */
export const SQUARE_OAUTH_NEXT_COOKIE = "square_oauth_next";

export const SQUARE_OAUTH_NEXT_CREATE_ORG = "create-organization";

export function formatSquareOAuthError(code: string, detail?: string | null): string {
  const extra = detail?.replace(/\s+/g, " ").trim();
  switch (code) {
    case "invalid_request":
      return extra
        ? `Square connection failed: invalid request. ${extra}`
        : "Square connection failed: invalid request. In the Square Developer Dashboard, set the OAuth redirect URL to the same value as SQUARE_REDIRECT_URI (/api/square/oauth/callback).";
    case "missing_code":
      return "Square returned without an authorization code. The OAuth redirect URL in the Square Developer Dashboard must match SQUARE_REDIRECT_URI exactly.";
    case "redirect_host":
      return extra
        ? `Square sends this connection back to ${extra}. Open that site to connect, or set SQUARE_REDIRECT_URI to this site and register that exact URL in the Square Developer Dashboard.`
        : "Square sends this connection back to a different site. Open that site to connect, or set SQUARE_REDIRECT_URI to this site and register that exact URL in the Square Developer Dashboard.";
    case "invalid_state":
      return "Square connection failed: session expired. Try again.";
    case "no_organization":
      return "Create the organization again before connecting Square.";
    case "oauth_not_configured":
      return "Square OAuth is not configured.";
    case "token_exchange":
      return "Square connection failed: could not exchange authorization code.";
    default:
      return extra
        ? `Square connection failed: ${code}. ${extra}`
        : `Square connection failed: ${code}`;
  }
}
