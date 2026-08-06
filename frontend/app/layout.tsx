import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import React from "react";

export const metadata: Metadata = {
  title: "Bamzy 💕 Real-Time Messenger",
  description: "A dreamy, real-time messaging application connecting friends with love.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full w-full overflow-hidden">
      <body className="antialiased h-full w-full overflow-hidden fixed inset-0 touch-manipulation">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}