import AuthProviders from "@/providers/auth-providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthProviders>{children}</AuthProviders>;
}
