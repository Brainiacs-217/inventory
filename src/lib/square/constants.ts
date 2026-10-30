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

export function formatSquareOAuthError(code: string): string {
  switch (code) {
    case "invalid_request":
      return "Square connection failed: invalid request.";
    case "invalid_state":
      return "Square connection failed: session expired. Try again.";
    case "no_organization":
      return "Create the organization again before connecting Square.";
    case "oauth_not_configured":
      return "Square OAuth is not configured.";
    case "token_exchange":
      return "Square connection failed: could not exchange authorization code.";
    default:
      return `Square connection failed: ${code}`;
  }
}
