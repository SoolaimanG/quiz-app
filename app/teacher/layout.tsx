import { AuthGuard } from "@/providers/auth-guard";
import { TeacherProvider } from "@/providers/teacher-provider";
import React from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard role="TEACHER">
      <TeacherProvider>{children}</TeacherProvider>
    </AuthGuard>
  );
}
