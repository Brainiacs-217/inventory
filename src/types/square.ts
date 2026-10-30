export type SquareOAuthScope =
  | "MERCHANT_PROFILE_READ"
  | "ORDERS_READ"
  | "ITEMS_READ";

export type SquareOAuthError = {
  category?: string;
  code?: string;
  detail?: string;
  field?: string;
};

export type SquareOAuthTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_at?: string;
  merchant_id?: string;
  refresh_token?: string;
  short_lived?: boolean;
  errors?: SquareOAuthError[];
};

/** Square OAuth tokens stored for one organization. */
export type SquareConnection = {
  merchantId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};
