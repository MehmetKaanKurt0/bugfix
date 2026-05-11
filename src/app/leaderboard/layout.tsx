import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BUGFIX Canlı Sıralama",
  description: "BUGFIX bug düzeltme yarışması canlı skor tablosu",
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
