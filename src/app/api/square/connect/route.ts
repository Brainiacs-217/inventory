import { randomBytes } from "crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SQUARE_OAUTH_STATE_COOKIE } from "@/lib/square/constants";
import { isSquareConfigured } from "@/lib/square/config";
import { buildSquareAuthorizationUrl } from "@/lib/square/oauth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  if (!isSquareConfigured()) {
    return NextResponse.json(
      { error: "Square is not configured." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const state = randomBytes(32).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set(SQUARE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(buildSquareAuthorizationUrl(state));
}
