import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased overflow-hidden">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}