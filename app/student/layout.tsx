import { AuthGuard } from "@/providers/auth-guard";
import React from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthGuard role="STUDENT">{children}</AuthGuard>;
}
