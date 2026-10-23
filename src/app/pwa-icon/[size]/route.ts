import { appIcon } from "@/lib/app-icon";

const SIZES = new Set(["192", "512"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;

  if (!SIZES.has(size)) {
    return new Response("Not found", { status: 404 });
  }

  return appIcon(Number(size));
}
