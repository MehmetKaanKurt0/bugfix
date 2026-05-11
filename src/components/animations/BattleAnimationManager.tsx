"use client";

import { useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { useAppStore, type RankingChange } from "@/lib/store";
import BattleOverlay, { type BattleOverlayHandle } from "./BattleOverlay";

export default function BattleAnimationManager() {
  const overlayRef = useRef<BattleOverlayHandle>(null);
  const setIsAnimating = useAppStore((s) => s.setIsAnimating);
  const setRankingChanges = useAppStore((s) => s.setRankingChanges);
  const setBattleComplete = useAppStore((s) => s.setBattleComplete);

  useEffect(() => {
    const supabase = createBrowserClient();

    const channel = supabase
      .channel("battle-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        async (payload) => {
          const event = payload.new as {
            type: string;
            data: {
              round_title: string;
              ranking_changes: RankingChange[];
            };
          };

          if (event.type === "round_finalized" && event.data?.ranking_changes) {
            setIsAnimating(true);
            setRankingChanges(event.data.ranking_changes);

            await overlayRef.current?.playSequence(
              event.data.round_title,
              event.data.ranking_changes
            );

            // Signal battle complete — leaderboard will animate rows
            setBattleComplete();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setIsAnimating, setRankingChanges, setBattleComplete]);

  return <BattleOverlay ref={overlayRef} />;
}
