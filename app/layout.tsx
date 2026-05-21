import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const siteTitle = "BEAT RUNNER";
const siteDescription = "小さな玩具キャラクターたちと音楽に合わせて遊ぶ、ブラウザで楽しめるリズムランナーゲーム。";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const ogpImageUrl = `${basePath}/ogp.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    images: [
      {
        url: ogpImageUrl,
        width: 1200,
        height: 630,
        alt: siteTitle
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [ogpImageUrl]
  },
  icons: {
    icon: [
      { url: `${basePath}/favicon.ico` },
      { url: `${basePath}/favicon.png`, type: "image/png", sizes: "512x512" }
    ],
    apple: [{ url: `${basePath}/apple-touch-icon.png`, sizes: "512x512", type: "image/png" }],
    other: [
      { rel: "icon", url: `${basePath}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { rel: "icon", url: `${basePath}/icon-512.png`, sizes: "512x512", type: "image/png" }
    ]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
