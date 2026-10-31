import { randomBytes } from "crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSelectedOrganizationId } from "@/lib/organizations/selectedOrg";
import {
  MAX_ORGANIZATION_NAME_LENGTH,
  SQUARE_OAUTH_NEXT_COOKIE,
  SQUARE_OAUTH_NEXT_CREATE_ORG,
  SQUARE_OAUTH_ORG_COOKIE,
  SQUARE_OAUTH_ORG_NAME_COOKIE,
  SQUARE_OAUTH_STATE_COOKIE,
} from "@/lib/square/constants";
import {
  getSquareRedirectUri,
  isSquareOAuthConfigured,
} from "@/lib/square/config";
import { buildSquareAuthorizationUrl } from "@/lib/square/oauth";
import { createClient } from "@/lib/supabase/server";

function resumeCreateRedirect(
  origin: string,
  params: Record<string, string>,
  pendingName: string,
) {
  const search = new URLSearchParams(params);
  search.set("resume_create_org", "1");
  if (pendingName) search.set("org_name", pendingName);
  return NextResponse.redirect(`${origin}/dashboard?${search.toString()}`);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { origin } = requestUrl;
  const creatingOrganization =
    requestUrl.searchParams.get("next") === SQUARE_OAUTH_NEXT_CREATE_ORG;
  const pendingName = requestUrl.searchParams.get("name")?.trim() ?? "";

  if (!isSquareOAuthConfigured()) {
    const params = { square_error: "oauth_not_configured" };
    return creatingOrganization
      ? resumeCreateRedirect(origin, params, pendingName)
      : NextResponse.redirect(`${origin}/dashboard?square_error=oauth_not_configured`);
  }

  let redirectUri: URL;
  try {
    redirectUri = new URL(getSquareRedirectUri());
  } catch {
    const params = { square_error: "oauth_not_configured" };
    return creatingOrganization
      ? resumeCreateRedirect(origin, params, pendingName)
      : NextResponse.redirect(`${origin}/dashboard?${new URLSearchParams(params)}`);
  }

  // The state cookie is set on this host. Square must send the browser back here.
  if (redirectUri.origin !== origin) {
    const params = {
      square_error: "redirect_host",
      square_error_detail: redirectUri.origin,
    };
    return creatingOrganization
      ? resumeCreateRedirect(origin, params, pendingName)
      : NextResponse.redirect(`${origin}/dashboard?${new URLSearchParams(params)}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  if (
    creatingOrganization &&
    (!pendingName || pendingName.length > MAX_ORGANIZATION_NAME_LENGTH)
  ) {
    return resumeCreateRedirect(origin, { square_error: "invalid_org_name" }, "");
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

  if (creatingOrganization) {
    cookieStore.set(
      SQUARE_OAUTH_ORG_NAME_COOKIE,
      encodeURIComponent(pendingName),
      cookieOptions,
    );
    cookieStore.delete(SQUARE_OAUTH_ORG_COOKIE);
    cookieStore.set(SQUARE_OAUTH_NEXT_COOKIE, SQUARE_OAUTH_NEXT_CREATE_ORG, cookieOptions);
  } else {
    const requestedOrganizationId = requestUrl.searchParams.get("organizationId");
    const organizationId =
      requestedOrganizationId || (await getSelectedOrganizationId());
    if (!organizationId) {
      return NextResponse.redirect(`${origin}/dashboard?square_error=no_organization`);
    }

    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("organization_id", organizationId)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.redirect(`${origin}/dashboard?square_error=no_organization`);
    }

    cookieStore.set(SQUARE_OAUTH_ORG_COOKIE, organizationId, cookieOptions);
    cookieStore.delete(SQUARE_OAUTH_ORG_NAME_COOKIE);
    cookieStore.delete(SQUARE_OAUTH_NEXT_COOKIE);
  }

  cookieStore.set(SQUARE_OAUTH_STATE_COOKIE, state, cookieOptions);
  return NextResponse.redirect(buildSquareAuthorizationUrl(state));
}
