"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin/teams");
      } else {
        setShake(true);
        setError("Şifre hatalı");
        setTimeout(() => setShake(false), 600);
      }
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <motion.form
          onSubmit={handleSubmit}
          animate={shake ? { x: [0, -12, 12, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="bg-card-bg border border-white/[0.06] rounded-2xl p-8 text-center"
        >
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="BT Logo"
              width={60}
              height={60}
              className="w-[60px] h-[60px] object-contain"
              style={{
                filter:
                  "drop-shadow(0 0 16px rgba(79,70,229,0.4))",
              }}
            />
          </div>

          <h1 className="text-2xl font-bold text-white mb-1 font-[family-name:var(--font-orbitron)] tracking-wider">
            BUGFIX
          </h1>
          <p className="text-white/40 text-sm mb-8">Admin Paneli</p>

          <div className="relative mb-4">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin şifresi"
              className="w-full bg-surface border border-white/[0.08] rounded-xl py-3 pl-10 pr-4
                text-white placeholder:text-white/30 font-mono text-sm
                focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30
                transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mb-4"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm
              bg-gradient-to-r from-primary to-secondary
              hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:scale-[1.02] active:scale-[0.98]
              disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none
              transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Giriş"
            )}
          </button>
        </motion.form>
      </motion.div>
    </div>
  );
}
