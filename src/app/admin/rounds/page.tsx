"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronDown, ChevronUp, Loader2, Zap, ZapOff, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import CodeEditor from "@/components/admin/CodeEditor";
import type { Round } from "@/types";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript", color: "#EAB308" },
  { value: "python", label: "Python", color: "#3B82F6" },
  { value: "cpp", label: "C++", color: "#EF4444" },
  { value: "java", label: "Java", color: "#F97316" },
  { value: "typescript", label: "TypeScript", color: "#3178C6" },
];

function langBadge(lang: string) {
  const l = LANGUAGES.find((x) => x.value === lang) || LANGUAGES[0];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ backgroundColor: l.color + "20", color: l.color }}
    >
      {l.label}
    </span>
  );
}

export default function RoundsPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRounds = useCallback(async () => {
    try {
      const res = await fetch("/api/rounds");
      const data = await res.json();
      if (data.rounds) setRounds(data.rounds);
    } catch {
      toast("Turlar yüklenemedi", "error");
    }
  }, []);

  useEffect(() => { fetchRounds(); }, [fetchRounds]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) {
      toast("Başlık ve kod gerekli", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), buggy_code: code, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRounds((prev) => [data.round, ...prev]);
      setTitle("");
      setCode("");
      toast("Tur oluşturuldu", "success");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Tur oluşturulamadı", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (round: Round) => {
    const newActive = !round.is_active;
    setTogglingId(round.id);
    try {
      const res = await fetch(`/api/rounds?id=${round.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRounds((prev) =>
        prev.map((r) => {
          if (r.id === round.id) return data.round;
          if (newActive) return { ...r, is_active: false };
          return r;
        })
      );
      toast(newActive ? `"${round.title}" aktif edildi` : `"${round.title}" pasif edildi`, "success");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Güncellenemedi", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (round: Round) => {
    if (!confirm(`"${round.title}" silinecek. Emin misiniz?`)) return;
    setDeletingId(round.id);
    try {
      const res = await fetch(`/api/rounds?id=${round.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRounds((prev) => prev.filter((r) => r.id !== round.id));
      toast(`"${round.title}" silindi`, "success");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Silinemedi", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="bg-card-bg border border-white/[0.06] rounded-2xl p-6 mb-8"
      >
        <h2 className="text-sm font-semibold text-white/70 mb-4">Yeni Tur</h2>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tur başlığı (örn: Tur 1 - Array Sorting Bug)"
            className="flex-1 bg-surface border border-white/[0.08] rounded-xl px-4 py-2.5
              text-white text-sm placeholder:text-white/30
              focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
          />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-surface border border-white/[0.08] rounded-xl px-4 py-2.5
              text-white text-sm appearance-none cursor-pointer shrink-0
              focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-white/40 mb-2">Hatalı Kod</label>
          <CodeEditor value={code} onChange={setCode} language={language} />
        </div>

        <button
          type="submit"
          disabled={creating || !title.trim() || !code.trim()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white
            bg-gradient-to-r from-primary to-secondary
            hover:shadow-[0_0_16px_rgba(79,70,229,0.4)] hover:scale-[1.02] active:scale-[0.98]
            disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none
            transition-all duration-200 flex items-center gap-2"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Turu Oluştur
        </button>
      </form>

      {/* Rounds list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {rounds.map((round) => {
            const isExpanded = expandedId === round.id;
            return (
              <motion.div
                key={round.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-card-bg border rounded-xl overflow-hidden transition-colors ${
                  round.is_active
                    ? "border-emerald-500/30 shadow-[0_0_12px_rgba(34,197,94,0.08)]"
                    : "border-white/[0.06]"
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-3 p-4">
                  {/* Status dot */}
                  <div className="shrink-0">
                    {round.is_active ? (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                    ) : (
                      <span className="block h-2.5 w-2.5 rounded-full bg-white/20" />
                    )}
                  </div>

                  {/* Title & meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm truncate">{round.title}</span>
                      {langBadge(round.language)}
                      <span className={`text-[11px] px-1.5 py-0.5 rounded ${
                        round.is_active ? "text-emerald-400 bg-emerald-400/10" : "text-white/30 bg-white/5"
                      }`}>
                        {round.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </div>
                    <p className="text-white/25 text-xs mt-0.5">
                      {new Date(round.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(round)}
                      disabled={togglingId === round.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        round.is_active
                          ? "text-amber-400 bg-amber-400/10 hover:bg-amber-400/20"
                          : "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20"
                      }`}
                    >
                      {togglingId === round.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : round.is_active ? (
                        <ZapOff className="w-3 h-3" />
                      ) : (
                        <Zap className="w-3 h-3" />
                      )}
                      {round.is_active ? "Pasif Yap" : "Aktif Yap"}
                    </button>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : round.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs
                        text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? "Gizle" : "Kodu Göster"}
                    </button>

                    <button
                      onClick={() => handleDelete(round)}
                      disabled={deletingId === round.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs
                        text-red-400/60 hover:text-red-400 hover:bg-red-400/[0.08] transition-colors"
                    >
                      {deletingId === round.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible code */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/[0.06] bg-[#0D1117] p-4">
                        <pre className="font-mono text-[13px] leading-[1.6] text-white/80 overflow-x-auto whitespace-pre">
                          {round.buggy_code}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {rounds.length === 0 && (
        <div className="text-center py-16 text-white/25 text-sm">
          Henüz tur oluşturulmadı
        </div>
      )}
    </div>
  );
}
