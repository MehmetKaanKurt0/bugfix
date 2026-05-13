"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, ListOrdered, Code, Flag, LogOut, Menu, X,
} from "lucide-react";
import ToastContainer from "@/components/ui/Toast";

const navItems = [
  { href: "/admin/teams", label: "Takımlar", icon: Users },
  { href: "/admin/rounds", label: "Turlar", icon: ListOrdered },
  { href: "/admin/grade", label: "Kod Değerlendir", icon: Code },
  { href: "/admin/finalize", label: "Tur Sonlandır", icon: Flag },
];

const pageTitles: Record<string, string> = {
  "/admin/teams": "Takımlar",
  "/admin/rounds": "Turlar",
  "/admin/grade": "Kod Değerlendir",
  "/admin/finalize": "Tur Sonlandır",
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeRoundTitle, setActiveRoundTitle] = useState<string | null>(null);

  const fetchActiveRound = useCallback(async () => {
    try {
      const res = await fetch("/api/rounds");
      const data = await res.json();
      const active = data.rounds?.find((r: { is_active: boolean }) => r.is_active);
      setActiveRoundTitle(active?.title ?? null);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchActiveRound(); }, [fetchActiveRound, pathname]);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  };

  const pageTitle = pageTitles[pathname] || "Admin";

  const sidebarContent = (
    <>
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/[0.06]">
        <Image src="/logo.png" alt="BT" width={40} height={40} className="w-10 h-10 object-contain" />
        <span className="text-lg font-bold tracking-widest font-[family-name:var(--font-orbitron)] text-white">BUGFIX</span>
      </div>

      {activeRoundTitle && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] text-emerald-400/80 truncate">{activeRoundTitle}</span>
          </div>
        </div>
      )}

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative
                ${isActive
                  ? "bg-primary/10 text-white border-l-2 border-primary"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.03] border-l-2 border-transparent"
                }`}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full
            text-red-400/70 hover:text-red-400 hover:bg-red-400/[0.06] transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={1.5} />
          Çıkış
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-dark-bg flex">
      <ToastContainer />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[260px] bg-card-bg border-r border-white/[0.06] flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-[260px] bg-card-bg z-50 flex flex-col md:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-5 p-1 text-white/40 hover:text-white/70"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Header */}
        <header className="h-[60px] bg-dark-bg border-b border-primary/20 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/[0.05]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base md:text-lg font-semibold text-white">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            {activeRoundTitle && (
              <span className="hidden lg:inline text-[11px] text-emerald-400/60 bg-emerald-400/5 px-2 py-1 rounded-md truncate max-w-[200px]">
                {activeRoundTitle}
              </span>
            )}
            <Image src="/logo.png" alt="BT" width={28} height={28} className="w-7 h-7 object-contain opacity-50" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
