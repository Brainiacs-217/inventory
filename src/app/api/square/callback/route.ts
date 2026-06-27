import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SQUARE_OAUTH_STATE_COOKIE } from "@/lib/square/constants";
import { isSquareConfigured } from "@/lib/square/config";
import { exchangeSquareAuthorizationCode } from "@/lib/square/oauth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${origin}/dashboard?square_error=${encodeURIComponent(error)}`,
    );
  }

  if (!isSquareConfigured() || !code || !state) {
    return NextResponse.redirect(`${origin}/dashboard?square_error=invalid_request`);
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get(SQUARE_OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(SQUARE_OAUTH_STATE_COOKIE);

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${origin}/dashboard?square_error=invalid_state`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  try {
    const tokens = await exchangeSquareAuthorizationCode(code);

    if (
      !tokens.access_token ||
      !tokens.refresh_token ||
      !tokens.merchant_id ||
      !tokens.expires_at
    ) {
      throw new Error("Square returned an incomplete token response.");
    }

    // TODO: persist SquareConnection for user/org in Supabase
    // { merchantId, accessToken, refreshToken, expiresAt }

    return NextResponse.redirect(`${origin}/dashboard?square_connected=1`);
  } catch {
    return NextResponse.redirect(`${origin}/dashboard?square_error=token_exchange`);
  }
}
