import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carrot",
  description: "Carrot inventory management",
  applicationName: "Carrot",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Carrot",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-white text-neutral-900 antialiased`}
      suppressHydrationWarning
    >
      <body
        className="flex h-dvh min-h-0 flex-col overflow-hidden bg-white text-neutral-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
