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

  try {
    const response = await fetch(`${baseUrl}/v2/orders/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": "2025-10-16",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        limit: 10,
        query: {
          sort: {
            sort_field: "CREATED_AT",
            sort_order: "DESC",
          },
        },
      }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Square request failed", details: data.errors },
        { status: response.status }
      );
    }

    const orders = (data.orders ?? []).map((order: any) => ({
      id: order.id,
      created_at: order.created_at,
      state: order.state,
      line_items: (order.line_items ?? []).map((item: any) => ({
        uid: item.uid,
        name: item.name,
        variation_id: item.catalog_object_id,
        quantity: Number(item.quantity),
        total_money: item.total_money,
        total_discount_money: item.total_discount_money,
        total_tax_money: item.total_tax_money,
      })),
    }));

    return NextResponse.json({
      orders,
      hasMore: Boolean(data.cursor),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to Square" },
      { status: 500 }
    );
  }
}