import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snowveil — Procedural WebGPU Snow",
  description:
    "A cinematic, fully procedural snow-world experiment rendered in real time with native WebGPU.",
};

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
