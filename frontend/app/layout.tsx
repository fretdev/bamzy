import type {Metadata} from "next";
import "./globals.css";
import  {AuthProvider} from "@/context/AuthContext";
import React from "react";

export const metadata: Metadata = {
  title: "Bamzy",
  description: "A real time chat app between two friends."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>){
  return (
      <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
      </html>
  )
}