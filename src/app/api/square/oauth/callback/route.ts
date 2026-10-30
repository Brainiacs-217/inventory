import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSelectedOrganizationId } from "@/lib/organizations/selectedOrg";
import { saveSquareConnectionFromOAuth } from "@/lib/square/connection";
import {
  SQUARE_OAUTH_NEXT_COOKIE,
  SQUARE_OAUTH_NEXT_CREATE_ORG,
  SQUARE_OAUTH_ORG_COOKIE,
  SQUARE_OAUTH_STATE_COOKIE,
} from "@/lib/square/constants";
import { isSquareOAuthConfigured } from "@/lib/square/config";
import { exchangeSquareAuthorizationCode } from "@/lib/square/oauth";
import { createClient } from "@/lib/supabase/server";

function dashboardRedirect(
  origin: string,
  params: Record<string, string>,
  resumeCreateOrganization: boolean,
) {
  const search = new URLSearchParams(params);
  if (resumeCreateOrganization) {
    search.set("resume_create_org", "1");
  }
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
  const oauthOrganizationId = cookieStore.get(SQUARE_OAUTH_ORG_COOKIE)?.value;
  const storedState = cookieStore.get(SQUARE_OAUTH_STATE_COOKIE)?.value;

  cookieStore.delete(SQUARE_OAUTH_STATE_COOKIE);
  cookieStore.delete(SQUARE_OAUTH_ORG_COOKIE);
  cookieStore.delete(SQUARE_OAUTH_NEXT_COOKIE);

  if (error) {
    return dashboardRedirect(
      origin,
      { square_error: error },
      resumeCreateOrganization,
    );
  }

  if (!isSquareOAuthConfigured() || !code || !state) {
    return dashboardRedirect(
      origin,
      { square_error: "invalid_request" },
      resumeCreateOrganization,
    );
  }

  if (!storedState || storedState !== state) {
    return dashboardRedirect(
      origin,
      { square_error: "invalid_state" },
      resumeCreateOrganization,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const organizationId = oauthOrganizationId || (await getSelectedOrganizationId());
  if (!organizationId) {
    return dashboardRedirect(
      origin,
      { square_error: "no_organization" },
      resumeCreateOrganization,
    );
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
        resumeCreateOrganization,
      );
    }

    return dashboardRedirect(
      origin,
      { square_connected: "1" },
      resumeCreateOrganization,
    );
  } catch {
    return dashboardRedirect(
      origin,
      { square_error: "token_exchange" },
      resumeCreateOrganization,
    );
  }
}
