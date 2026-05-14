"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { useAppStore, type RankingChange } from "@/lib/store";
import CinematicOverlay, { type BattlePair, type ScenePhase } from "./CinematicOverlay";
import { audioManager } from "./utils/audioManager";

function buildBattlePairs(changes: RankingChange[]): BattlePair[] {
  const scored = changes.filter((c) => c.score_change > 0).sort((a, b) => b.score_change - a.score_change);
  const movedUp = changes.filter((c) => c.new_rank < c.old_rank).sort((a, b) => a.new_rank - b.new_rank);
  const movedDown = changes.filter((c) => c.new_rank > c.old_rank).sort((a, b) => b.new_rank - a.new_rank);

  const pairs: BattlePair[] = [];

  for (let i = 0; i < movedUp.length; i++) {
    const defender = movedDown[i] || movedDown[movedDown.length - 1];
    if (defender) {
      pairs.push({
        attacker: { name: movedUp[i].team_name, color: movedUp[i].team_color, scoreChange: movedUp[i].score_change },
        defender: { name: defender.team_name, color: defender.team_color },
      });
    }
  }

  if (pairs.length === 0 && scored.length >= 2) {
    for (let i = 0; i < scored.length - 1; i += 2) {
      pairs.push({
        attacker: { name: scored[i].team_name, color: scored[i].team_color, scoreChange: scored[i].score_change },
        defender: { name: scored[i + 1].team_name, color: scored[i + 1].team_color },
      });
    }
  }

  if (pairs.length === 0 && scored.length === 1) {
    pairs.push({
      attacker: { name: scored[0].team_name, color: scored[0].team_color, scoreChange: scored[0].score_change },
      defender: { name: scored[0].team_name, color: scored[0].team_color },
    });
  }

  return pairs;
}

export default function CinematicBattleManager() {
  const setIsAnimating = useAppStore((s) => s.setIsAnimating);
  const setRankingChanges = useAppStore((s) => s.setRankingChanges);
  const setBattleComplete = useAppStore((s) => s.setBattleComplete);

  const [visible, setVisible] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<ScenePhase | null>(null);

  const phasesRef = useRef<ScenePhase[]>([]);
  const phaseIndexRef = useRef(0);
  const lastAnimRef = useRef(-1);
  const resolveRef = useRef<(() => void) | null>(null);

  const pickAnimIndex = useCallback(() => {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * 5);
    } while (idx === lastAnimRef.current && 5 > 1);
    lastAnimRef.current = idx;
    return idx;
  }, []);

  const startSequence = useCallback(
    (roundTitle: string, changes: RankingChange[]) => {
      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reducedMotion) {
        setBattleComplete();
        return;
      }

      const pairs = buildBattlePairs(changes);
      if (pairs.length === 0) {
        setBattleComplete();
        return;
      }

      const phases: ScenePhase[] = [];
      phases.push({ type: "intro", roundTitle, duration: 3 });

      for (const pair of pairs) {
        const animIdx = pickAnimIndex();
        phases.push({ type: "vs", battle: pair, roundTitle, duration: 2.5 });
        phases.push({ type: "battle", battle: pair, animIndex: animIdx, duration: 4.5 });
        phases.push({ type: "victory", battle: pair, duration: 3 });
      }

      phasesRef.current = phases;
      phaseIndexRef.current = 0;

      setIsAnimating(true);
      setRankingChanges(changes);
      setVisible(true);
      setCurrentPhase(phases[0]);
    },
    [setIsAnimating, setRankingChanges, setBattleComplete, pickAnimIndex]
  );

  const handlePhaseComplete = useCallback(() => {
    phaseIndexRef.current += 1;
    const nextIdx = phaseIndexRef.current;
    const phases = phasesRef.current;

    if (nextIdx >= phases.length) {
      setVisible(false);
      setCurrentPhase(null);
      setBattleComplete();
      if (resolveRef.current) {
        resolveRef.current();
        resolveRef.current = null;
      }
      return;
    }

    const next = phases[nextIdx];
    audioManager.playForPhase(next.type, next.type === "battle" ? next.animIndex : undefined);
    setCurrentPhase(next);
  }, [setBattleComplete]);

  // Supabase realtime listener
  useEffect(() => {
    const supabase = createBrowserClient();

    const channel = supabase
      .channel("cinematic-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        (payload) => {
          const event = payload.new as {
            type: string;
            data: { round_title: string; ranking_changes: RankingChange[] };
          };

          if (event.type === "round_finalized" && event.data?.ranking_changes) {
            startSequence(event.data.round_title, event.data.ranking_changes);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [startSequence]);

  // Expose for direct calls (finalize page)
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__cinematicStart = (
      roundTitle: string,
      changes: RankingChange[]
    ) => {
      return new Promise<void>((resolve) => {
        resolveRef.current = resolve;
        startSequence(roundTitle, changes);
      });
    };

    return () => {
      delete (window as unknown as Record<string, unknown>).__cinematicStart;
    };
  }, [startSequence]);

  return (
    <CinematicOverlay
      visible={visible}
      phase={currentPhase}
      onPhaseComplete={handlePhaseComplete}
    />
  );
}
