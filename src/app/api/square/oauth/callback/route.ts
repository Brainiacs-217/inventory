import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getSelectedOrganizationId,
  SELECTED_ORG_COOKIE,
} from "@/lib/organizations/selectedOrg";
import {
  createOrganizationWithSquareConnection,
  saveSquareConnectionFromOAuth,
} from "@/lib/square/connection";
import {
  readPendingOrganizationName,
  SQUARE_OAUTH_NEXT_COOKIE,
  SQUARE_OAUTH_NEXT_CREATE_ORG,
  SQUARE_OAUTH_ORG_COOKIE,
  SQUARE_OAUTH_ORG_NAME_COOKIE,
  SQUARE_OAUTH_STATE_COOKIE,
} from "@/lib/square/constants";
import { isSquareOAuthConfigured } from "@/lib/square/config";
import { exchangeSquareAuthorizationCode } from "@/lib/square/oauth";
import { createClient } from "@/lib/supabase/server";

function dashboardRedirect(
  origin: string,
  params: Record<string, string>,
  resume: { createOrganization: boolean; orgName?: string | null; organizationId?: string },
) {
  const search = new URLSearchParams(params);
  if (resume.createOrganization) {
    search.set("resume_create_org", "1");
  }
  if (resume.orgName) search.set("org_name", resume.orgName);
  if (resume.organizationId) search.set("organization_id", resume.organizationId);
  return NextResponse.redirect(`${origin}/dashboard?${search.toString()}`);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const resumeCreateOrganization =
    cookieStore.get(SQUARE_OAUTH_NEXT_COOKIE)?.value === SQUARE_OAUTH_NEXT_CREATE_ORG;
  const pendingOrgName = readPendingOrganizationName(
    cookieStore.get(SQUARE_OAUTH_ORG_NAME_COOKIE)?.value,
  );
  const oauthOrganizationId = cookieStore.get(SQUARE_OAUTH_ORG_COOKIE)?.value;
  const storedState = cookieStore.get(SQUARE_OAUTH_STATE_COOKIE)?.value;
  const resume = {
    createOrganization: resumeCreateOrganization,
    orgName: pendingOrgName,
  };

  cookieStore.delete(SQUARE_OAUTH_STATE_COOKIE);
  cookieStore.delete(SQUARE_OAUTH_ORG_COOKIE);
  cookieStore.delete(SQUARE_OAUTH_ORG_NAME_COOKIE);
  cookieStore.delete(SQUARE_OAUTH_NEXT_COOKIE);

  if (error) {
    const detail = searchParams.get("error_description");
    console.error("Square OAuth redirect error", error, detail);
    return dashboardRedirect(
      origin,
      {
        square_error: error,
        ...(detail ? { square_error_detail: detail.slice(0, 200) } : {}),
      },
      resume,
    );
  }

  if (!isSquareOAuthConfigured() || !code || !state) {
    console.error("Square OAuth callback missing authorization", {
      configured: isSquareOAuthConfigured(),
      hasCode: Boolean(code),
      hasState: Boolean(state),
    });
    return dashboardRedirect(origin, { square_error: "missing_code" }, resume);
  }

  if (!storedState || storedState !== state) {
    return dashboardRedirect(origin, { square_error: "invalid_state" }, resume);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  let tokens: Awaited<ReturnType<typeof exchangeSquareAuthorizationCode>>;
  try {
    tokens = await exchangeSquareAuthorizationCode(code);
    if (
      !tokens.access_token ||
      !tokens.refresh_token ||
      !tokens.merchant_id ||
      !tokens.expires_at
    ) {
      throw new Error("Square returned an incomplete token response.");
    }
  } catch (exchangeError) {
    console.error("Square OAuth token exchange failed", exchangeError);
    return dashboardRedirect(origin, { square_error: "token_exchange" }, resume);
  }

  if (resumeCreateOrganization) {
    if (!pendingOrgName) {
      return dashboardRedirect(origin, { square_error: "invalid_org_name" }, resume);
    }

    const created = await createOrganizationWithSquareConnection(
      user.id,
      pendingOrgName,
      {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        merchantId: tokens.merchant_id,
        expiresAt: tokens.expires_at,
      },
    );

    if ("error" in created) {
      return dashboardRedirect(
        origin,
        { square_error: "org_not_created", square_error_detail: created.error },
        resume,
      );
    }

    cookieStore.set(SELECTED_ORG_COOKIE, created.organizationId, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return dashboardRedirect(
      origin,
      { square_connected: "1" },
      { ...resume, organizationId: created.organizationId },
    );
  }

  const organizationId = oauthOrganizationId || (await getSelectedOrganizationId());
  if (!organizationId) {
    return dashboardRedirect(origin, { square_error: "no_organization" }, resume);
  }

  const result = await saveSquareConnectionFromOAuth(organizationId, {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    merchant_id: tokens.merchant_id,
    expires_at: tokens.expires_at,
  });

  if ("error" in result) {
    return dashboardRedirect(
      origin,
      { square_error: result.error },
      resume,
    );
  }

  return dashboardRedirect(origin, { square_connected: "1" }, resume);
}
