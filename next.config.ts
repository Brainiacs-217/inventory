import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server only trusts localhost. A phone on the LAN address is blocked
  // from the dev websocket, which leaves the page as static HTML.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "172.*.*.*"],
};

export default nextConfig;
