import { randomBytes } from "crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSelectedOrganizationId } from "@/lib/organizations/selectedOrg";
import {
  SQUARE_OAUTH_NEXT_COOKIE,
  SQUARE_OAUTH_NEXT_CREATE_ORG,
  SQUARE_OAUTH_ORG_COOKIE,
  SQUARE_OAUTH_STATE_COOKIE,
} from "@/lib/square/constants";
import { isSquareOAuthConfigured } from "@/lib/square/config";
import { buildSquareAuthorizationUrl } from "@/lib/square/oauth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  if (!isSquareOAuthConfigured()) {
    return NextResponse.redirect(`${origin}/dashboard?square_error=oauth_not_configured`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const organizationId = await getSelectedOrganizationId();
  if (!organizationId) {
    return NextResponse.redirect(`${origin}/dashboard?square_error=no_organization`);
  }

  const state = randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  };

  cookieStore.set(SQUARE_OAUTH_STATE_COOKIE, state, cookieOptions);
  cookieStore.set(SQUARE_OAUTH_ORG_COOKIE, organizationId, cookieOptions);

  const next = new URL(request.url).searchParams.get("next");
  if (next === SQUARE_OAUTH_NEXT_CREATE_ORG) {
    cookieStore.set(SQUARE_OAUTH_NEXT_COOKIE, next, cookieOptions);
  } else {
    cookieStore.delete(SQUARE_OAUTH_NEXT_COOKIE);
  }

  return NextResponse.redirect(buildSquareAuthorizationUrl(state));
}
