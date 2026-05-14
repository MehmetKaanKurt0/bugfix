"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, Clock, XCircle,
  Loader2, ChevronDown, ChevronUp, Flag, Minus,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";
import CinematicBattleManager from "@/components/animations/CinematicBattleManager";
import type { Team, Round, Submission } from "@/types";
import type { RankingChange } from "@/lib/store";

interface RoundEvent {
  id: string;
  type: string;
  data: {
    round_id: string;
    round_title: string;
    ranking_changes: {
      team_name: string;
      old_rank: number;
      new_rank: number;
      old_score: number;
      new_score: number;
      score_change: number;
    }[];
  };
  created_at: string;
}

export default function FinalizePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [pastRounds, setPastRounds] = useState<Round[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [events, setEvents] = useState<RoundEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [confirming, setConfirming] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [teamsRes, roundsRes, eventsRes] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/rounds"),
        fetch("/api/events"),
      ]);
      const teamsData = await teamsRes.json();
      const roundsData = await roundsRes.json();
      const eventsData = await eventsRes.json();

      if (teamsData.teams) setTeams(teamsData.teams);
      if (eventsData.events) setEvents(eventsData.events);

      const rounds: Round[] = roundsData.rounds || [];
      const active = rounds.find((r) => r.is_active) || null;
      setActiveRound(active);
      setPastRounds(rounds.filter((r) => !r.is_active));

      if (active) {
        const subsRes = await fetch(`/api/submissions?round_id=${active.id}`);
        const subsData = await subsRes.json();
        if (subsData.submissions) setSubmissions(subsData.submissions);
      }
    } catch {
      toast("Veriler yüklenemedi", "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const submissionMap = new Map(
    submissions.map((s) => [s.team_id, s])
  );

  const approvedCount = submissions.filter((s) => s.status === "approved").length;
  const totalTeams = teams.length;

  const handleFinalize = async () => {
    if (!activeRound) return;
    setFinalizing(true);

    try {
      const res = await fetch("/api/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ round_id: activeRound.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setConfirming(false);

      if (data.ranking_changes) {
        const startCinematic = (window as unknown as Record<string, unknown>).__cinematicStart as
          | ((title: string, changes: RankingChange[]) => Promise<void>)
          | undefined;
        if (startCinematic) {
          await startCinematic(activeRound.title, data.ranking_changes);
        }
      }

      toast("Tur sonlandırıldı!", "success");
      fetchData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Sonlandırma başarısız", "error");
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return <div className="text-white/30 text-sm py-20 text-center">Yükleniyor...</div>;
  }

  return (
    <div className="max-w-4xl">
      {/* Active round info */}
      {!activeRound ? (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 flex items-center gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-amber-400 font-semibold text-sm">Aktif tur bulunmuyor</p>
            <p className="text-amber-400/60 text-xs mt-0.5">Turlar sayfasından bir tur başlatın.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Round card */}
          <div className="bg-card-bg border border-emerald-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <div>
                <p className="text-white font-semibold text-sm">{activeRound.title}</p>
                <p className="text-white/30 text-xs">{activeRound.language}</p>
              </div>
            </div>
          </div>

          {/* Submissions table */}
          <div className="bg-card-bg border border-white/[0.06] rounded-xl overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white/70">Değerlendirme Durumu</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/30 text-xs border-b border-white/[0.04]">
                    <th className="text-left px-5 py-2.5 font-medium">Takım</th>
                    <th className="text-center px-3 py-2.5 font-medium">AI Puanı</th>
                    <th className="text-center px-3 py-2.5 font-medium">Final Puanı</th>
                    <th className="text-center px-3 py-2.5 font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => {
                    const sub = submissionMap.get(team.id);
                    return (
                      <tr key={team.id} className="border-b border-white/[0.03] last:border-0">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ backgroundColor: team.avatar_color }}
                            >
                              {team.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-white font-medium text-sm">{team.name}</span>
                          </div>
                        </td>
                        <td className="text-center px-3 py-3 font-mono text-white/60">
                          {sub ? sub.ai_score : <Minus className="w-3.5 h-3.5 mx-auto text-white/20" />}
                        </td>
                        <td className="text-center px-3 py-3 font-mono text-white/60">
                          {sub?.final_score != null ? sub.final_score : <Minus className="w-3.5 h-3.5 mx-auto text-white/20" />}
                        </td>
                        <td className="text-center px-3 py-3">
                          {!sub ? (
                            <span className="text-white/20 text-xs">—</span>
                          ) : sub.status === "approved" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Onaylandı
                            </span>
                          ) : sub.status === "pending" ? (
                            <span className="inline-flex items-center gap-1 text-amber-400 text-xs">
                              <Clock className="w-3.5 h-3.5" /> Bekliyor
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                              <XCircle className="w-3.5 h-3.5" /> Reddedildi
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-white/[0.06] text-xs text-white/40">
              {approvedCount}/{totalTeams} takım değerlendirildi
            </div>
          </div>

          {/* Warning if not all graded */}
          {approvedCount < totalTeams && (
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 mb-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400/70 mt-0.5 shrink-0" />
              <p className="text-amber-400/70 text-xs leading-relaxed">
                Henüz tüm takımlar puanlanmadı. Yine de sonlandırabilirsiniz.
              </p>
            </div>
          )}

          {/* Finalize button + confirm dialog */}
          <AnimatePresence mode="wait">
            {!confirming ? (
              <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button
                  onClick={() => setConfirming(true)}
                  className="w-full py-4 rounded-xl text-sm font-bold text-white
                    bg-gradient-to-r from-red-500/80 via-secondary to-primary
                    hover:shadow-[0_0_24px_rgba(124,58,237,0.3)] hover:scale-[1.01]
                    transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  Turu Sonlandır ve Sıralamayı Güncelle
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card-bg border border-red-500/20 rounded-xl p-6 text-center"
              >
                <Flag className="w-8 h-8 text-red-400/60 mx-auto mb-3" />
                <p className="text-white font-semibold text-sm mb-1">
                  &ldquo;{activeRound.title}&rdquo; sonlandırılacak
                </p>
                <p className="text-white/40 text-xs mb-5">
                  Leaderboard güncellenecek ve savaş animasyonları tetiklenecek.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleFinalize}
                    disabled={finalizing}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white
                      bg-gradient-to-r from-red-500 to-secondary
                      hover:shadow-[0_0_16px_rgba(239,68,68,0.3)] active:scale-[0.98]
                      disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
                  >
                    {finalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Devam Et
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={finalizing}
                    className="px-6 py-2.5 rounded-xl text-sm text-white/50 border border-white/10
                      hover:bg-white/[0.04] transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Past rounds */}
      {pastRounds.length > 0 && (
        <div className="mt-10">
          <h3 className="text-sm font-semibold text-white/40 mb-3">Önceki Turlar</h3>
          <div className="space-y-2">
            {pastRounds.map((round) => {
              const event = events.find(
                (e) => e.type === "round_finalized" && e.data?.round_id === round.id
              );
              const isExpanded = expandedEventId === round.id;

              return (
                <div key={round.id} className="bg-card-bg border border-white/[0.06] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedEventId(isExpanded ? null : round.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div>
                      <p className="text-white/80 text-sm font-medium">{round.title}</p>
                      <p className="text-white/25 text-xs mt-0.5">
                        {new Date(round.created_at).toLocaleDateString("tr-TR", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-white/30 text-xs">
                      {event ? "Sonuçları Gör" : "Sonuç yok"}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && event && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-white/[0.04]">
                          <table className="w-full text-xs mt-3">
                            <thead>
                              <tr className="text-white/25">
                                <th className="text-left py-1.5 font-medium">Takım</th>
                                <th className="text-center py-1.5 font-medium">Sıra</th>
                                <th className="text-right py-1.5 font-medium">Puan</th>
                              </tr>
                            </thead>
                            <tbody>
                              {event.data.ranking_changes
                                .sort((a, b) => a.new_rank - b.new_rank)
                                .map((rc) => {
                                  const rankDiff = rc.old_rank - rc.new_rank;
                                  return (
                                    <tr key={rc.team_name} className="border-t border-white/[0.03]">
                                      <td className="py-2 text-white/70">{rc.team_name}</td>
                                      <td className="py-2 text-center">
                                        <span className="text-white/50 font-mono">{rc.new_rank}</span>
                                        {rankDiff !== 0 && (
                                          <span className={`ml-1.5 text-[10px] ${rankDiff > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                            {rankDiff > 0 ? `▲${rankDiff}` : `▼${Math.abs(rankDiff)}`}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 text-right">
                                        {rc.score_change > 0 && (
                                          <span className="text-emerald-400/70 mr-1.5">+{rc.score_change}</span>
                                        )}
                                        <span className="text-white/60 font-mono">{rc.new_score}</span>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <CinematicBattleManager />
    </div>
  );
}
