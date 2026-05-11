"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import type { Team } from "@/types";

const COLORS = [
  "#EF4444", "#3B82F6", "#22C55E", "#8B5CF6",
  "#F97316", "#EC4899", "#06B6D4", "#EAB308",
];

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/teams");
      const data = await res.json();
      if (data.teams) setTeams(data.teams);
    } catch {
      toast("Takımlar yüklenemedi", "error");
    }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), avatar_color: color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTeams((prev) => [data.team, ...prev]);
      setName("");
      toast(`${data.team.name} eklendi`, "success");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Takım eklenemedi", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (team: Team) => {
    try {
      const res = await fetch(`/api/teams?id=${team.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setTeams((prev) => prev.filter((t) => t.id !== team.id));
      setDeletingId(null);
      toast(`${team.name} silindi`, "success");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Silinemedi", "error");
    }
  };

  const handleSaveScore = async (team: Team) => {
    const score = parseInt(editScore);
    if (isNaN(score)) { toast("Geçerli bir sayı girin", "error"); return; }
    try {
      const res = await fetch(`/api/teams?id=${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total_score: score }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTeams((prev) => prev.map((t) => (t.id === team.id ? data.team : t)));
      setEditingId(null);
      toast("Puan güncellendi", "success");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Güncellenemedi", "error");
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="bg-card-bg border border-white/[0.06] rounded-2xl p-6 mb-8"
      >
        <h2 className="text-sm font-semibold text-white/70 mb-4">Yeni Takım</h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Takım adı"
            className="flex-1 bg-surface border border-white/[0.08] rounded-xl px-4 py-2.5
              text-white text-sm placeholder:text-white/30
              focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
          />
          <button
            type="submit"
            disabled={adding || !name.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-primary to-secondary
              hover:shadow-[0_0_16px_rgba(79,70,229,0.4)] hover:scale-[1.02] active:scale-[0.98]
              disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none
              transition-all duration-200 flex items-center gap-2 shrink-0"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Takım Ekle
          </button>
        </div>

        {/* Color picker */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-xs text-white/40 mr-1">Renk:</span>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-all duration-150 ${
                color === c ? "ring-2 ring-white ring-offset-2 ring-offset-card-bg scale-110" : "hover:scale-110"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </form>

      {/* Team grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {teams.map((team) => (
            <motion.div
              key={team.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="relative bg-card-bg border border-white/[0.06] rounded-xl p-4"
            >
              {/* Delete confirmation overlay */}
              <AnimatePresence>
                {deletingId === team.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-dark-bg/90 rounded-xl flex flex-col items-center justify-center gap-3 z-10"
                  >
                    <p className="text-sm text-white/80 text-center px-4">
                      <span className="font-semibold text-white">{team.name}</span> silinecek. Emin misin?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(team)}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                      >
                        Sil
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        İptal
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Card content */}
              <div className="relative flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                  style={{ backgroundColor: team.avatar_color }}
                >
                  {team.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{team.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {editingId === team.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          value={editScore}
                          onChange={(e) => setEditScore(e.target.value)}
                          className="w-20 bg-surface border border-primary/30 rounded-lg px-2 py-1 text-white text-sm font-mono
                            focus:outline-none focus:ring-1 focus:ring-primary/50"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveScore(team);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveScore(team)}
                          className="p-1 rounded-md text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded-md text-white/40 hover:bg-white/5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-white/40 text-xs">{team.total_score} puan</span>
                    )}
                  </div>
                </div>

                {/* Score big */}
                {editingId !== team.id && (
                  <span className="text-2xl font-bold font-mono text-white/80">{team.total_score}</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                <button
                  onClick={() => {
                    setEditingId(team.id);
                    setEditScore(String(team.total_score));
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                    text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Düzenle
                </button>
                <button
                  onClick={() => setDeletingId(team.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                    text-red-400/60 hover:text-red-400 hover:bg-red-400/[0.06] transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Sil
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {teams.length === 0 && (
        <div className="text-center py-16 text-white/25 text-sm">
          Henüz takım eklenmedi
        </div>
      )}
    </div>
  );
}
