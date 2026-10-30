import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const environment = process.env.SQUARE_ENV;

  if (!token) {
    return NextResponse.json(
      { error: "Missing SQUARE_ACCESS_TOKEN" },
      { status: 500 }
    );
  }

  const baseUrl =
    environment === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

  try {
    const response = await fetch(
      `${baseUrl}/v2/catalog/list?types=ITEM`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Square-Version": "2025-10-16",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Square API request failed", details: data.errors },
        { status: response.status }
      );
    }

    const items = (data.objects ?? []).map((item: any) => ({
      id: item.id,
      name: item.item_data?.name,
      variations: (item.item_data?.variations ?? []).map(
        (variation: any) => ({
          id: variation.id,
          name: variation.item_variation_data?.name,
          price: variation.item_variation_data?.price_money,
        })
      ),
    }));

    return NextResponse.json({
      environment,
      items,
      hasMore: Boolean(data.cursor),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to Square" },
      { status: 500 }
    );
  }
}

