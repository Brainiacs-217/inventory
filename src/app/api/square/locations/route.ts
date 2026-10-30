import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.SQUARE_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "Missing Square access token" },
      { status: 500 }
    );
  }

  const baseUrl =
    process.env.SQUARE_ENV === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

  const response = await fetch(`${baseUrl}/v2/locations`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Square-Version": "2025-10-16",
    },
    cache: "no-store",
  });

  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}