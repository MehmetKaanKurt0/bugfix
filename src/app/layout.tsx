import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BUGFIX - Bilgisayar Topluluğu Kod Yarışması",
  description:
    "Bilgisayar Topluluğu tarafından düzenlenen takımlar arası bug düzeltme yarışması platformu",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body
        className={`${orbitron.variable} ${inter.variable} font-sans antialiased bg-dark-bg text-white`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
