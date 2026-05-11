"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, ChevronDown, ChevronUp, Check,
  Loader2, Send, RefreshCw, Pencil, Ban, Bug, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";
import CodeEditor from "@/components/admin/CodeEditor";
import ScoreRing from "@/components/admin/ScoreRing";
import type { Team, Round, GradeResult } from "@/types";

type Phase = "input" | "grading" | "result";

const LANG_LABELS: Record<string, string> = {
  javascript: "JavaScript", python: "Python", cpp: "C++",
  java: "Java", typescript: "TypeScript",
};

export default function GradePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [gradedTeamIds, setGradedTeamIds] = useState<Set<string>>(new Set());
  const [showOriginal, setShowOriginal] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");

  const [phase, setPhase] = useState<Phase>("input");
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [rawError, setRawError] = useState<string | null>(null);

  const [editingScore, setEditingScore] = useState(false);
  const [customScore, setCustomScore] = useState("");
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [approving, setApproving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [teamsRes, roundsRes] = await Promise.all([
        fetch("/api/teams"), fetch("/api/rounds"),
      ]);
      const teamsData = await teamsRes.json();
      const roundsData = await roundsRes.json();

      if (teamsData.teams) setTeams(teamsData.teams);

      const active = roundsData.rounds?.find((r: Round) => r.is_active) || null;
      setActiveRound(active);

      if (active) {
        const subsRes = await fetch(`/api/submissions?round_id=${active.id}`);
        const subsData = await subsRes.json();
        const graded = new Set<string>(
          (subsData.submissions || [])
            .filter((s: { status: string }) => s.status === "approved")
            .map((s: { team_id: string }) => s.team_id)
        );
        setGradedTeamIds(graded);
      }
    } catch {
      toast("Veriler yüklenemedi", "error");
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGrade = async () => {
    if (!selectedTeamId || !submittedCode.trim() || !activeRound) return;

    setPhase("grading");
    setGradeResult(null);
    setRawError(null);

    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buggy_code: activeRound.buggy_code,
          submitted_code: submittedCode,
          language: activeRound.language,
          team_id: selectedTeamId,
          round_id: activeRound.id,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        toast("Bu takım bu turda zaten puanlandı", "error");
        setPhase("input");
        return;
      }

      if (!res.ok) {
        if (data.raw) {
          setRawError(data.raw);
        }
        throw new Error(data.error || "Puanlama başarısız");
      }

      setGradeResult(data.result);
      setSubmissionId(data.submission?.id || null);
      setCustomScore(String(data.result.score));
      setPhase("result");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "AI yanıt vermedi", "error");
      if (!rawError) setPhase("input");
    }
  };

  const handleApprove = async (status: "approved" | "rejected") => {
    if (!submissionId) return;
    setApproving(true);

    const finalScore = editingScore ? parseInt(customScore) : gradeResult?.score;

    try {
      const res = await fetch("/api/grade", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId, status, final_score: finalScore }),
      });

      if (!res.ok) throw new Error((await res.json()).error);

      const teamName = teams.find((t) => t.id === selectedTeamId)?.name;

      if (status === "approved") {
        toast(`${teamName} +${finalScore} puan aldı!`, "success");
        setGradedTeamIds((prev) => new Set(prev).add(selectedTeamId));
      } else {
        toast(`${teamName} puanı reddedildi`, "error");
      }

      resetForm();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "İşlem başarısız", "error");
    } finally {
      setApproving(false);
    }
  };

  const resetForm = () => {
    setPhase("input");
    setSelectedTeamId("");
    setSubmittedCode("");
    setGradeResult(null);
    setSubmissionId(null);
    setEditingScore(false);
    setShowDiff(false);
    setRawError(null);
    setShowDetailedFeedback(false);
  };

  // --- No active round ---
  if (!activeRound) {
    return (
      <div className="max-w-3xl">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-amber-400 font-semibold text-sm">Aktif tur yok</p>
            <p className="text-amber-400/60 text-xs mt-0.5">Önce Turlar sayfasından bir tur başlatın.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Active round info */}
      <div className="bg-card-bg border border-emerald-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div>
              <p className="text-white font-semibold text-sm">{activeRound.title}</p>
              <p className="text-white/30 text-xs">{LANG_LABELS[activeRound.language] || activeRound.language}</p>
            </div>
          </div>
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            {showOriginal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Orijinal Kod
          </button>
        </div>
        <AnimatePresence>
          {showOriginal && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <pre className="mt-3 p-4 bg-[#0D1117] rounded-lg font-mono text-[13px] leading-[1.6] text-white/80 overflow-x-auto whitespace-pre">
                {activeRound.buggy_code}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* INPUT PHASE */}
      {phase === "input" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Team selection */}
          <div className="mb-4">
            <label className="block text-xs text-white/40 mb-2">Takım Seç</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full bg-surface border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm
                focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
            >
              <option value="">Takım seçin...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id} disabled={gradedTeamIds.has(t.id)}>
                  {t.name}{gradedTeamIds.has(t.id) ? " (Puanlandı ✓)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Code area */}
          <div className="mb-4">
            <label className="block text-xs text-white/40 mb-2">Takımın Düzelttiği Kod</label>
            <CodeEditor
              value={submittedCode}
              onChange={setSubmittedCode}
              language={activeRound.language}
            />
          </div>

          {/* Diff toggle */}
          {submittedCode.trim() && (
            <div className="mb-4">
              <button
                onClick={() => setShowDiff(!showDiff)}
                className="text-xs text-primary/70 hover:text-primary transition-colors"
              >
                {showDiff ? "Karşılaştırmayı gizle" : "Orijinal ile karşılaştır"}
              </button>
              <AnimatePresence>
                {showDiff && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <p className="text-[11px] text-red-400/60 mb-1 font-semibold">Orijinal (Hatalı)</p>
                        <pre className="p-3 bg-[#0D1117] rounded-lg font-mono text-[12px] leading-[1.6] text-red-300/70 overflow-auto max-h-[300px] whitespace-pre border border-red-500/10">
                          {activeRound.buggy_code}
                        </pre>
                      </div>
                      <div>
                        <p className="text-[11px] text-emerald-400/60 mb-1 font-semibold">Düzeltilmiş</p>
                        <pre className="p-3 bg-[#0D1117] rounded-lg font-mono text-[12px] leading-[1.6] text-emerald-300/70 overflow-auto max-h-[300px] whitespace-pre border border-emerald-500/10">
                          {submittedCode}
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Raw error fallback */}
          {rawError && (
            <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-amber-400 text-sm font-semibold mb-2">AI yanıtı ayrıştırılamadı. Ham yanıt:</p>
              <pre className="text-white/60 text-xs overflow-auto max-h-[200px] whitespace-pre-wrap">{rawError}</pre>
            </div>
          )}

          {/* Grade button */}
          <button
            onClick={handleGrade}
            disabled={!selectedTeamId || !submittedCode.trim()}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-primary to-secondary
              hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:scale-[1.02] active:scale-[0.98]
              disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none
              transition-all duration-200 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            AI ile Puanla
          </button>
        </motion.div>
      )}

      {/* GRADING PHASE */}
      {phase === "grading" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card-bg border border-primary/20 rounded-2xl p-8"
        >
          {/* Scan effect */}
          <div className="relative rounded-xl overflow-hidden bg-[#0D1117] p-4 mb-6 min-h-[200px]">
            <pre className="font-mono text-[13px] leading-[1.6] text-white/30 whitespace-pre overflow-hidden max-h-[200px]">
              {submittedCode}
            </pre>
            <motion.div
              className="absolute left-0 right-0 h-[2px]"
              style={{
                background: "linear-gradient(90deg, transparent, #4F46E5, #06B6D4, transparent)",
                boxShadow: "0 0 20px rgba(79,70,229,0.5), 0 0 40px rgba(6,182,212,0.3)",
              }}
              animate={{ top: ["0%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <TypingText text="BUGFIX AI kodu inceliyor..." />
          </div>
        </motion.div>
      )}

      {/* RESULT PHASE */}
      {phase === "result" && gradeResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Score ring */}
          <div className="bg-card-bg border border-white/[0.06] rounded-2xl p-8 mb-4">
            <ScoreRing score={gradeResult.score} />

            {/* Roast */}
            <div className="mt-6 bg-surface rounded-xl p-4 border-l-4 border-secondary">
              <p className="text-white/70 text-sm italic">&ldquo;{gradeResult.roast}&rdquo;</p>
            </div>

            {/* Summary */}
            <p className="mt-4 text-white font-semibold text-sm text-center">{gradeResult.summary}</p>
          </div>

          {/* Bug lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <BugList icon={<Bug className="w-3.5 h-3.5" />} title="Bulunan Hatalar" items={gradeResult.bugs_found} color="white" />
            <BugList icon={<CheckCircle2 className="w-3.5 h-3.5" />} title="Düzeltilen Hatalar" items={gradeResult.bugs_fixed} color="emerald" />
            <BugList icon={<XCircle className="w-3.5 h-3.5" />} title="Kaçırılan Hatalar" items={gradeResult.bugs_missed} color="red" />
            {gradeResult.new_bugs.length > 0 && (
              <BugList icon={<AlertCircle className="w-3.5 h-3.5" />} title="Yeni Eklenen Hatalar" items={gradeResult.new_bugs} color="amber" />
            )}
          </div>

          {/* Detailed feedback */}
          <div className="mb-6">
            <button
              onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              {showDetailedFeedback ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Detaylı Analiz
            </button>
            <AnimatePresence>
              {showDetailedFeedback && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 bg-card-bg border border-white/[0.06] rounded-xl p-4">
                    <p className="text-white/60 text-sm whitespace-pre-wrap leading-relaxed">
                      {gradeResult.detailed_feedback}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Approval actions */}
          <div className="bg-card-bg border border-white/[0.06] rounded-xl p-5">
            {editingScore ? (
              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm text-white/50">Puan:</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={customScore}
                  onChange={(e) => setCustomScore(e.target.value)}
                  className="w-24 bg-surface border border-primary/30 rounded-lg px-3 py-1.5 text-white text-sm font-mono
                    focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  onClick={() => setEditingScore(false)}
                  className="text-xs text-white/40 hover:text-white/60"
                >
                  İptal
                </button>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleApprove("approved")}
                disabled={approving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                  bg-emerald-500/15 text-emerald-400 border border-emerald-500/25
                  hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
              >
                {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Bu puanı onayla ({editingScore ? customScore : gradeResult.score} puan)
              </button>

              {!editingScore && (
                <button
                  onClick={() => { setEditingScore(true); setCustomScore(String(gradeResult.score)); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                    text-white/50 border border-white/10 hover:bg-white/[0.04] transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Puanı düzenle
                </button>
              )}

              <button
                onClick={() => handleApprove("rejected")}
                disabled={approving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                  text-red-400/70 border border-red-500/20 hover:bg-red-500/[0.06] transition-colors disabled:opacity-50"
              >
                <Ban className="w-3.5 h-3.5" />
                Reddet
              </button>

              <button
                onClick={resetForm}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                  text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-colors ml-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sıfırla
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* --- Subcomponents --- */

function TypingText({ text }: { text: string }) {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplay(text.slice(0, ++i));
      if (i >= text.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className="text-white/60 text-sm">
      {display}
      <span className="animate-pulse">|</span>
    </span>
  );
}

function BugList({
  icon, title, items, color,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  color: string;
}) {
  const colorMap: Record<string, string> = {
    white: "text-white/70 bg-white/5 border-white/[0.06]",
    emerald: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10",
    red: "text-red-400 bg-red-500/5 border-red-500/10",
    amber: "text-amber-400 bg-amber-500/5 border-amber-500/10",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-semibold">{title}</span>
        <span className="text-[11px] opacity-50">({items.length})</span>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs opacity-70 leading-relaxed pl-5 relative">
            <span className="absolute left-0">•</span>
            {item}
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-xs opacity-40 italic">Yok</li>
        )}
      </ul>
    </div>
  );
}
