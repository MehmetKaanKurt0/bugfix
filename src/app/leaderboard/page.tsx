"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { Crown, Trophy, Volume2, VolumeX } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";
import CinematicBattleManager from "@/components/animations/CinematicBattleManager";
import ConnectionBanner from "@/components/ui/ConnectionBanner";
import { SkeletonPodium, SkeletonRow } from "@/components/ui/Skeleton";
import { useAppStore } from "@/lib/store";
import type { Team } from "@/types";

interface RankedTeam extends Team {
  rank: number;
  prevRank: number | null;
  scoreChange: number | null;
  direction: "up" | "down" | "none";
}

function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 10) return "az önce";
  if (diff < 60) return `${diff} saniye önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
  return `${Math.floor(diff / 3600)} saat önce`;
}

const SPRING_TRANSITION = {
  type: "spring" as const,
  stiffness: 100,
  damping: 18,
  duration: 0.8,
};

function ScoreChangeBadge({ change, show }: { change: number; show: boolean }) {
  return (
    <AnimatePresence>
      {show && change !== 0 && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3 }}
          className={`text-[11px] font-mono px-2 py-0.5 rounded-full
            ${change > 0
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
            }`}
        >
          {change > 0 ? "+" : ""}{change}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function PodiumCard({
  team,
  displayIdx,
  showBadge,
}: {
  team: RankedTeam;
  displayIdx: number;
  showBadge: boolean;
}) {
  const isFirst = displayIdx === 1;
  const rankColors = ["#C0C0C0", "#FFD700", "#CD7F32"];
  const rankColor = rankColors[displayIdx];
  const sizes = isFirst ? "pt-6 pb-5 min-h-[220px]" : "pt-5 pb-4 min-h-[190px]";
  const podiumEffect = displayIdx === 1 ? "podium-gold" : displayIdx === 0 ? "podium-silver" : "podium-bronze";
  const controls = useAnimationControls();

  useEffect(() => {
    if (showBadge && team.direction === "up") {
      controls.start({
        scale: [1, 1.03, 1],
        transition: { duration: 0.5, delay: 0.3 },
      });

      if (isFirst) {
        controls.start({
          boxShadow: [
            "0 0 0px rgba(255,215,0,0)",
            "0 0 30px rgba(255,215,0,0.25)",
            "0 0 10px rgba(255,215,0,0.08)",
            "0 0 30px rgba(255,215,0,0.2)",
            "0 0 10px rgba(255,215,0,0.08)",
          ],
          transition: { duration: 2, delay: 0.3 },
        });
      }
    }
  }, [showBadge, team.direction, isFirst, controls]);

  return (
    <motion.div
      layout
      layoutId={`podium-${team.id}`}
      animate={controls}
      transition={SPRING_TRANSITION}
      className={`flex-1 max-w-[200px] bg-card-bg rounded-2xl px-3 ${sizes} flex flex-col items-center justify-center text-center ${podiumEffect}
        ${isFirst
          ? "border border-yellow-500/30"
          : displayIdx === 0 ? "border border-white/[0.12]" : "border border-amber-700/20"
        }
        ${showBadge && team.direction === "up"
          ? "ring-1 ring-emerald-500/30"
          : ""
        }`}
      style={{
        opacity: showBadge && team.direction === "down" ? 0.7 : 1,
      }}
    >
      <div className="mb-2">
        {isFirst ? (
          <Crown
            className="w-7 h-7"
            style={{
              color: rankColor,
              filter: `drop-shadow(0 0 6px ${rankColor}55)`,
            }}
          />
        ) : (
          <span className="text-2xl font-bold font-mono" style={{ color: rankColor }}>
            {team.rank}
          </span>
        )}
      </div>

      <div
        className={`rounded-full flex items-center justify-center text-white font-bold shrink-0
          ${isFirst ? "w-16 h-16 text-xl" : "w-12 h-12 text-base"}`}
        style={{
          backgroundColor: team.avatar_color,
          boxShadow: isFirst ? `0 0 20px ${team.avatar_color}44` : undefined,
        }}
      >
        {team.name.charAt(0).toUpperCase()}
      </div>

      <p className={`mt-2 text-white font-semibold truncate w-full ${isFirst ? "text-sm" : "text-xs"}`}>
        {team.name}
      </p>

      <p
        className={`font-bold font-mono mt-1 ${isFirst ? "text-2xl" : "text-xl"}`}
        style={{
          color: rankColor,
          textShadow: isFirst ? `0 0 12px ${rankColor}66` : undefined,
        }}
      >
        {team.total_score}
      </p>

      <ScoreChangeBadge change={team.scoreChange ?? 0} show={showBadge} />
    </motion.div>
  );
}

function RankRow({
  team,
  isLast,
  showBadge,
}: {
  team: RankedTeam;
  isLast: boolean;
  showBadge: boolean;
}) {
  const controls = useAnimationControls();

  useEffect(() => {
    if (showBadge && team.direction === "up") {
      controls.start({
        scale: [1, 1.03, 1],
        transition: { duration: 0.4, delay: 0.2 },
      });
    }
  }, [showBadge, team.direction, controls]);

  const glowBorder = showBadge && team.direction === "up"
    ? `0 0 12px ${team.avatar_color}33`
    : undefined;

  return (
    <motion.div
      layout
      layoutId={`row-${team.id}`}
      animate={controls}
      transition={SPRING_TRANSITION}
      className={`flex items-center gap-4 px-5 py-3.5
        ${!isLast ? "border-b border-white/[0.05]" : ""}`}
      style={{
        opacity: showBadge && team.direction === "down" ? 0.7 : 1,
        boxShadow: glowBorder,
      }}
    >
      <span className="w-8 text-center text-white/30 font-mono text-sm">
        {team.rank}
      </span>

      <div className="w-4">
        {team.prevRank !== null && team.prevRank !== team.rank && (
          <span
            className={`text-[10px] font-mono ${
              team.prevRank > team.rank ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {team.prevRank > team.rank ? "▲" : "▼"}
          </span>
        )}
      </div>

      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
        style={{ backgroundColor: team.avatar_color }}
      >
        {team.name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm truncate">{team.name}</p>
      </div>

      <ScoreChangeBadge change={team.scoreChange ?? 0} show={showBadge} />

      <div className="text-right">
        <p className="text-white font-bold font-mono text-lg">{team.total_score}</p>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const [teams, setTeams] = useState<RankedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [relTime, setRelTime] = useState("az önce");
  const [showBadges, setShowBadges] = useState(false);
  const prevRanksRef = useRef<Map<string, number>>(new Map());
  const prevScoresRef = useRef<Map<string, number>>(new Map());
  const badgeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const isAnimating = useAppStore((s) => s.isAnimating);
  const rankingChanges = useAppStore((s) => s.rankingChanges);
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const toggleSound = useAppStore((s) => s.toggleSound);

  const applyRanking = useCallback((rawTeams: Team[], fromBattle = false) => {
    const sorted = [...rawTeams].sort((a, b) => b.total_score - a.total_score);
    const prevRanks = prevRanksRef.current;
    const prevScores = prevScoresRef.current;

    const ranked: RankedTeam[] = sorted.map((t, i) => {
      const prev = prevRanks.get(t.id) ?? null;
      const prevScore = prevScores.get(t.id);
      const sc = prevScore !== undefined ? t.total_score - prevScore : null;
      let direction: "up" | "down" | "none" = "none";
      if (prev !== null && prev !== i + 1) {
        direction = prev > i + 1 ? "up" : "down";
      }
      return { ...t, rank: i + 1, prevRank: prev, scoreChange: sc, direction };
    });

    const newRanks = new Map<string, number>();
    const newScores = new Map<string, number>();
    ranked.forEach((t) => {
      newRanks.set(t.id, t.rank);
      newScores.set(t.id, t.total_score);
    });
    prevRanksRef.current = newRanks;
    prevScoresRef.current = newScores;

    setTeams(ranked);
    setLastUpdate(new Date());

    if (fromBattle) {
      setShowBadges(true);
      clearTimeout(badgeTimerRef.current);
      badgeTimerRef.current = setTimeout(() => setShowBadges(false), 4000);
    }
  }, []);

  const fetchTeams = useCallback(async (fromBattle = false) => {
    try {
      const res = await fetch("/api/teams");
      const data = await res.json();
      if (data.teams) applyRanking(data.teams, fromBattle);
    } catch { /* silent */ }
    setLoading(false);
  }, [applyRanking]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  // When battle completes, wait then refresh with animations
  useEffect(() => {
    if (!isAnimating && rankingChanges !== null) {
      const timer = setTimeout(() => fetchTeams(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, rankingChanges, fetchTeams]);

  // Realtime subscriptions
  useEffect(() => {
    const supabase = createBrowserClient();

    const teamsChannel = supabase
      .channel("realtime:teams")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "teams" }, () => {
        if (!useAppStore.getState().isAnimating) fetchTeams();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "teams" }, () => fetchTeams())
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "teams" }, () => fetchTeams())
      .subscribe();

    return () => { supabase.removeChannel(teamsChannel); };
  }, [fetchTeams]);

  // Relative time ticker
  useEffect(() => {
    const interval = setInterval(() => setRelTime(relativeTime(lastUpdate)), 10000);
    setRelTime(relativeTime(lastUpdate));
    return () => clearInterval(interval);
  }, [lastUpdate]);

  const podium = teams.slice(0, 3);
  const rest = teams.slice(3);
  const podiumOrder =
    podium.length === 3 ? [podium[1], podium[0], podium[2]] : podium;

  return (
    <main className="relative min-h-screen bg-dark-bg pt-20 pb-12 px-4 overflow-x-hidden">
      <CinematicBattleManager />
      <ConnectionBanner />

      {/* Blur overlay during battle animation */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9998] pointer-events-none"
            style={{
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)",
            filter: "blur(100px)",
            opacity: 0.08,
            top: "10%",
            left: "5%",
            animation: "orbFloat1 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{
            background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)",
            filter: "blur(80px)",
            opacity: 0.06,
            top: "40%",
            right: "10%",
            animation: "orbFloat2 25s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[350px] h-[350px] rounded-full"
          style={{
            background: "radial-gradient(circle, #06B6D4 0%, transparent 70%)",
            filter: "blur(90px)",
            opacity: 0.05,
            bottom: "10%",
            left: "30%",
            animation: "orbFloat3 22s ease-in-out infinite",
          }}
        />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="BT"
              width={60}
              height={60}
              className="w-[60px] h-[60px] object-contain"
              style={{ filter: "drop-shadow(0 0 16px rgba(79,70,229,0.4))" }}
            />
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold tracking-[0.15em] font-[family-name:var(--font-orbitron)]"
            style={{
              textShadow:
                "0 0 20px rgba(79,70,229,0.5), 0 0 40px rgba(124,58,237,0.3)",
            }}
          >
            BUGFIX
          </h1>
          <p className="mt-2 text-white/40 text-sm tracking-wide">Canlı Sıralama</p>

          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px]
              border transition-colors
              ${soundEnabled
                ? "border-primary/30 bg-primary/10 text-primary/80"
                : "border-white/10 bg-white/[0.03] text-white/30 hover:text-white/50"
              }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {soundEnabled ? "Ses Açık" : "Ses Kapalı"}
          </button>
        </motion.div>

        {loading ? (
          <div>
            <SkeletonPodium />
            <div className="bg-card-bg border border-white/[0.06] rounded-2xl overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={i < 4 ? "border-b border-white/[0.05]" : ""}>
                  <SkeletonRow />
                </div>
              ))}
            </div>
          </div>
        ) : teams.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card-bg border border-white/[0.06] rounded-2xl p-12 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-white/20" strokeWidth={1} />
            </div>
            <p className="text-white/40 text-lg mb-1">Henüz takım yok</p>
            <p className="text-white/25 text-sm">
              Takımlar eklendiğinde sıralama burada görünecek
            </p>
          </motion.div>
        ) : (
          <>
            {/* Podium — desktop */}
            {podium.length >= 3 && (
              <div className="hidden md:flex items-end justify-center gap-3 lg:gap-5 mb-10 px-2">
                {podiumOrder.map((team, displayIdx) => (
                  <PodiumCard key={team.id} team={team} displayIdx={displayIdx} showBadge={showBadges} />
                ))}
              </div>
            )}

            {podium.length > 0 && podium.length < 3 && (
              <div className="hidden md:flex items-end justify-center gap-4 mb-10">
                {(podium.length === 2 ? [podium[1], podium[0]] : podium).map((team, i) => (
                  <PodiumCard key={team.id} team={team} displayIdx={podium.length === 1 ? 1 : i} showBadge={showBadges} />
                ))}
              </div>
            )}

            {/* All teams as flat list — mobile only */}
            <div className="md:hidden bg-card-bg border border-white/[0.06] rounded-2xl overflow-hidden mb-4">
              {teams.map((team, i) => (
                <RankRow key={team.id} team={team} isLast={i === teams.length - 1} showBadge={showBadges} />
              ))}
            </div>

            {/* Rest of the list — desktop (4+) */}
            {rest.length > 0 && (
              <div className="hidden md:block bg-card-bg border border-white/[0.06] rounded-2xl overflow-hidden">
                {rest.map((team, i) => (
                  <RankRow key={team.id} team={team} isLast={i === rest.length - 1} showBadge={showBadges} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-white/20 text-xs mb-4">Son güncelleme: {relTime}</p>
          <div className="flex items-center justify-center gap-2">
            <Image
              src="/logo.png"
              alt="BT"
              width={24}
              height={24}
              className="w-6 h-6 object-contain opacity-40"
            />
            <span className="text-white/30 text-xs">
              BUGFIX tarafından desteklenmektedir • Bilgisayar Topluluğu
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
