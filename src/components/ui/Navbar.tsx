"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Trophy, Shield, Home } from "lucide-react";

const links = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/leaderboard", label: "Sıralama", icon: Trophy },
  { href: "/admin", label: "Admin", icon: Shield },
];

export default function Navbar() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/80 backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="BT"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
          />
          <span className="text-sm font-bold tracking-[0.15em] font-[family-name:var(--font-orbitron)] text-white">
            BUGFIX
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
                  ${
                    isActive
                      ? "text-white bg-primary/15"
                      : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"
                  }`}
              >
                <link.icon className="w-4 h-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
