import { ImageResponse } from "next/og";

export function appIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#171717",
          color: "#ffffff",
          fontSize: Math.round(size * 0.42),
          fontWeight: 600,
        }}
      >
        B
      </div>
    ),
    { width: size, height: size },
  );
}
