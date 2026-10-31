import { timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

import { publicSyncError, syncAllOrganizations, syncOrganization } from "@/lib/square/sync/run";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 300;

function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;

  const token = header.slice("Bearer ".length);
  const provided = Buffer.from(token);
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

function batchResponse(outcome: Awaited<ReturnType<typeof syncAllOrganizations>>) {
  return NextResponse.json(outcome, { status: outcome.failures.length > 0 ? 500 : 200 });
}

async function syncEveryOrganization() {
  try {
    return batchResponse(await syncAllOrganizations());
  } catch (error) {
    console.error("Square sync failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: publicSyncError(error) }, { status: 500 });
  }
}

/** Vercel Cron calls this path with GET and Authorization: Bearer CRON_SECRET. */
export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return syncEveryOrganization();
}

/** A signed-in member syncs one org. The cron secret syncs every connected org. */
export async function POST(request: Request) {
  if (cronAuthorized(request)) {
    return syncEveryOrganization();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const organizationId =
    body &&
    typeof body === "object" &&
    "organizationId" in body &&
    typeof body.organizationId === "string"
      ? body.organizationId
      : "";

  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required." }, { status: 400 });
  }

  const { data: member } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!member) {
    return NextResponse.json(
      { error: "You are not a member of this organization." },
      { status: 403 },
    );
  }

  try {
    const result = await syncOrganization(organizationId);
    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "Square sync failed",
      organizationId,
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: publicSyncError(error) }, { status: 500 });
  }
}
