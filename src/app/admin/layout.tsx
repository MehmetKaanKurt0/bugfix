import type { Metadata } from "next";
import { cookies } from "next/headers";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "BUGFIX Admin Panel",
  description: "BUGFIX yarışması admin yönetim paneli",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("bugfix_admin_token");
  const isAuthenticated = token?.value === "authenticated";

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}
