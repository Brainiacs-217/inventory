/** OAuth scopes requested when a merchant connects Square. */
export const SQUARE_OAUTH_SCOPES = [
  "MERCHANT_PROFILE_READ",
  "ORDERS_READ",
  "ITEMS_READ",
] as const;

export const SQUARE_OAUTH_STATE_COOKIE = "square_oauth_state";
