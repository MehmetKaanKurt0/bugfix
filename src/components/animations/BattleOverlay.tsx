"use client";

import {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BattleAnimation, BattleActor } from "./animations/types";
import { drawImpactText, sleep } from "./utils/particles";
import { useAppStore } from "@/lib/store";
import Confetti from "./Confetti";
import {
  playBoom, playCrackling, playPewPew, playMeteor, playPortal, playVS, playConfetti,
} from "@/lib/sounds";

import { BombAnimation } from "./animations/BombAnimation";
import { LightningAnimation } from "./animations/LightningAnimation";
import { MeteorAnimation } from "./animations/MeteorAnimation";
import { LaserAnimation } from "./animations/LaserAnimation";
import { PortalAnimation } from "./animations/PortalAnimation";

const ALL_ANIMATIONS: BattleAnimation[] = [
  BombAnimation,
  LightningAnimation,
  MeteorAnimation,
  LaserAnimation,
  PortalAnimation,
];

const ANIM_SOUNDS: Record<string, () => void> = {
  BombAnimation: playBoom,
  LightningAnimation: playCrackling,
  MeteorAnimation: playMeteor,
  LaserAnimation: playPewPew,
  PortalAnimation: playPortal,
};

interface RankingChange {
  team_id: string;
  team_name: string;
  team_color: string;
  old_rank: number;
  new_rank: number;
  old_score: number;
  new_score: number;
  score_change: number;
}

export interface BattleOverlayHandle {
  playSequence(roundTitle: string, changes: RankingChange[]): Promise<void>;
}

interface VSInfo {
  attacker: { name: string; color: string };
  defender: { name: string; color: string };
  roundTitle: string;
}

const BattleOverlay = forwardRef<BattleOverlayHandle>(function BattleOverlay(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [splashText, setSplashText] = useState<{ title: string; sub: string } | null>(null);
  const [vsInfo, setVsInfo] = useState<VSInfo | null>(null);
  const lastAnimRef = useRef(-1);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  function pickAnimation(): { anim: BattleAnimation; name: string } {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * ALL_ANIMATIONS.length);
    } while (idx === lastAnimRef.current && ALL_ANIMATIONS.length > 1);
    lastAnimRef.current = idx;
    const names = ["BombAnimation", "LightningAnimation", "MeteorAnimation", "LaserAnimation", "PortalAnimation"];
    return { anim: ALL_ANIMATIONS[idx], name: names[idx] };
  }

  async function showScoreChange(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    scoreChange: number
  ) {
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const ch = canvas.height / (window.devicePixelRatio || 1);
    const text = `+${scoreChange} PUAN!`;
    let alpha = 0;
    const duration = 1500;
    const start = performance.now();

    await new Promise<void>((resolve) => {
      function draw(now: number) {
        const elapsed = now - start;
        ctx.clearRect(0, 0, cw, ch);

        if (elapsed < 300) alpha = elapsed / 300;
        else if (elapsed > duration - 400) alpha = Math.max(0, (duration - elapsed) / 400);
        else alpha = 1;

        drawImpactText(ctx, text, cw / 2, ch / 2, 1, alpha, "#FFD700", "#FF8C00");

        if (elapsed < duration) requestAnimationFrame(draw);
        else resolve();
      }
      requestAnimationFrame(draw);
    });
  }

  useImperativeHandle(ref, () => ({
    async playSequence(roundTitle: string, changes: RankingChange[]) {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const movedUp = changes.filter((c) => c.new_rank < c.old_rank).sort((a, b) => a.new_rank - b.new_rank);
      const movedDown = changes.filter((c) => c.new_rank > c.old_rank).sort((a, b) => b.new_rank - a.new_rank);

      const pairs: { attacker: RankingChange; defender: RankingChange }[] = [];
      for (let i = 0; i < movedUp.length; i++) {
        const defender = movedDown[i] || movedDown[movedDown.length - 1];
        if (defender) {
          pairs.push({ attacker: movedUp[i], defender });
        }
      }

      if (pairs.length === 0) return;

      const hasNewFirst = movedUp.some((c) => c.new_rank === 1);

      setVisible(true);
      await sleep(600);

      if (reducedMotion) {
        setSplashText({ title: roundTitle, sub: "Sıralama güncellendi" });
        await sleep(2500);
        setSplashText(null);
        if (hasNewFirst) {
          setTriggerConfetti(true);
          setTimeout(() => setTriggerConfetti(false), 3200);
        }
        setVisible(false);
        return;
      }

      resizeCanvas();

      setSplashText({ title: roundTitle, sub: "Sıralama değişiyor..." });
      await sleep(2000);
      setSplashText(null);
      await sleep(300);

      const canvas = canvasRef.current;
      if (!canvas) { setVisible(false); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { setVisible(false); return; }

      const soundOn = useAppStore.getState().soundEnabled;

      for (const pair of pairs) {
        const { anim, name: animName } = pickAnimation();
        const attacker: BattleActor = {
          name: pair.attacker.team_name,
          color: pair.attacker.team_color,
        };
        const defender: BattleActor = {
          name: pair.defender.team_name,
          color: pair.defender.team_color,
        };

        setVsInfo({
          attacker: { name: attacker.name, color: attacker.color },
          defender: { name: defender.name, color: defender.color },
          roundTitle,
        });
        if (soundOn) playVS();
        await sleep(1500);
        setVsInfo(null);
        await sleep(200);

        resizeCanvas();

        if (soundOn) {
          const sfx = ANIM_SOUNDS[animName];
          if (sfx) setTimeout(sfx, 400);
        }

        await anim.play(canvas, ctx, attacker, defender, pair.attacker.score_change);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        await showScoreChange(ctx, canvas, pair.attacker.score_change);

        await sleep(500);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (hasNewFirst) {
        if (soundOn) playConfetti();
        setTriggerConfetti(true);
        setTimeout(() => setTriggerConfetti(false), 3200);
      }

      setVisible(false);
    },
  }));

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
          >
            {/* Letterbox bars */}
            <div className="absolute top-0 left-0 right-0 h-[60px] bg-black z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-black z-10" />

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 z-[5]"
              style={{ top: 60, bottom: 60, height: "calc(100% - 120px)" }}
            />

            {/* Splash overlay */}
            <AnimatePresence>
              {splashText && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center"
                >
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl md:text-5xl font-bold text-white font-[family-name:var(--font-orbitron)] tracking-wider text-center"
                    style={{ textShadow: "0 0 30px rgba(79,70,229,0.6)" }}
                  >
                    TUR SONUÇLARI
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-3 text-white/50 text-sm"
                  >
                    {splashText.title}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-2 text-primary/60 text-xs tracking-widest"
                  >
                    {splashText.sub}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* VS Screen */}
            <AnimatePresence>
              {vsInfo && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 z-30 flex items-center justify-center"
                  style={{
                    background: "radial-gradient(ellipse at 30% 50%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(239,68,68,0.15) 0%, transparent 50%)",
                  }}
                >
                  <div className="flex items-center gap-4 md:gap-10 w-full max-w-2xl px-6">
                    {/* Attacker */}
                    <motion.div
                      initial={{ x: -120, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl md:text-3xl"
                        style={{
                          backgroundColor: vsInfo.attacker.color,
                          boxShadow: `0 0 30px ${vsInfo.attacker.color}66`,
                        }}
                      >
                        {vsInfo.attacker.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="mt-3 text-white font-semibold text-sm md:text-base truncate max-w-[140px] text-center">
                        {vsInfo.attacker.name}
                      </p>
                    </motion.div>

                    {/* VS */}
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: [0, 1.5, 1], rotate: [-20, 5, 0] }}
                      transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                      className="shrink-0"
                    >
                      <span
                        className="text-5xl md:text-7xl font-black font-[family-name:var(--font-orbitron)] tracking-wider"
                        style={{
                          background: "linear-gradient(135deg, #3B82F6, #EF4444)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          filter: "drop-shadow(0 0 20px rgba(239,68,68,0.4)) drop-shadow(0 0 20px rgba(59,130,246,0.4))",
                        }}
                      >
                        VS
                      </span>
                    </motion.div>

                    {/* Defender */}
                    <motion.div
                      initial={{ x: 120, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl md:text-3xl"
                        style={{
                          backgroundColor: vsInfo.defender.color,
                          boxShadow: `0 0 30px ${vsInfo.defender.color}66`,
                        }}
                      >
                        {vsInfo.defender.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="mt-3 text-white font-semibold text-sm md:text-base truncate max-w-[140px] text-center">
                        {vsInfo.defender.name}
                      </p>
                    </motion.div>
                  </div>

                  {/* Round title */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="absolute bottom-[80px] text-white/30 text-xs md:text-sm tracking-[0.3em] font-[family-name:var(--font-orbitron)]"
                  >
                    {vsInfo.roundTitle}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti renders outside the battle overlay so it stays visible after overlay closes */}
      <Confetti active={triggerConfetti} />
    </>
  );
});

export default BattleOverlay;
