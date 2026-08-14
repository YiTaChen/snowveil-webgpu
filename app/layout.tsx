import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "Snowveil — Frost Rite WebGPU";
  const description =
    "Ride a winter caster through persistent procedural snow and awaken three original frost sigils.";
  const socialImage = `${origin}/og.png`;

  return {
    title,
    description,
    metadataBase: new URL(origin),
    openGraph: {
      type: "website",
      url: origin,
      title,
      description,
      images: [{ url: socialImage, width: 1200, height: 630, alt: "Snowveil Frost Rite" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
