export type SquareEnv = "sandbox" | "production";

export function getSquareEnv(): SquareEnv {
  return process.env.SQUARE_ENV === "production" ? "production" : "sandbox";
}

export function isSquareConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID &&
      process.env.SQUARE_APPLICATION_SECRET &&
      process.env.SQUARE_REDIRECT_URI,
  );
}

export function getSquareApplicationId(): string {
  const id = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  if (!id) {
    throw new Error("NEXT_PUBLIC_SQUARE_APPLICATION_ID is not set.");
  }
  return id;
}

export function getSquareApplicationSecret(): string {
  const secret = process.env.SQUARE_APPLICATION_SECRET;
  if (!secret) {
    throw new Error("SQUARE_APPLICATION_SECRET is not set.");
  }
  return secret;
}

export function getSquareRedirectUri(): string {
  const redirectUri = process.env.SQUARE_REDIRECT_URI;
  if (!redirectUri) {
    throw new Error("SQUARE_REDIRECT_URI is not set.");
  }
  return redirectUri;
}

export function getSquareConnectBaseUrl(): string {
  const env = getSquareEnv();
  return env === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}
