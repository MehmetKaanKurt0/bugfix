"use client";

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface BattlePair {
  attacker: { name: string; color: string; scoreChange: number };
  defender: { name: string; color: string };
}

export type ScenePhase =
  | { type: "intro"; roundTitle: string; duration: number }
  | { type: "vs"; battle: BattlePair; roundTitle: string; duration: number }
  | { type: "battle"; battle: BattlePair; animIndex: number; duration: number }
  | { type: "victory"; battle: BattlePair; duration: number };

interface CinematicOverlayProps {
  visible: boolean;
  phase: ScenePhase | null;
  onPhaseComplete: () => void;
}

function IntroScene2D({ roundTitle, onDone }: { roundTitle: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <Starfield />
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center z-10"
      >
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white/50 text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-orbitron)]"
        >
          Sıradaki Tur
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold mt-4 font-[family-name:var(--font-orbitron)]"
          style={{
            textShadow: "0 0 30px rgba(79,70,229,0.8), 0 0 60px rgba(124,58,237,0.4)",
          }}
        >
          {roundTitle}
        </motion.h1>
      </motion.div>
    </div>
  );
}

function VSScene2D({
  battle,
  roundTitle,
  onDone,
}: {
  battle: BattlePair;
  roundTitle: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <Starfield />
      {/* Attacker from left */}
      <motion.div
        initial={{ x: "-100vw", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute left-[10%] md:left-[15%] text-center z-10"
      >
        <div
          className="w-20 h-20 md:w-28 md:h-28 rounded-full mx-auto mb-3 border-2"
          style={{
            backgroundColor: battle.attacker.color + "33",
            borderColor: battle.attacker.color,
            boxShadow: `0 0 30px ${battle.attacker.color}80`,
          }}
        />
        <p className="text-white font-bold text-lg md:text-xl font-[family-name:var(--font-orbitron)]">
          {battle.attacker.name}
        </p>
      </motion.div>

      {/* VS text */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
        className="z-20"
      >
        <span
          className="text-5xl md:text-7xl font-black font-[family-name:var(--font-orbitron)]"
          style={{
            textShadow: "0 0 40px rgba(239,68,68,0.8), 0 0 80px rgba(239,68,68,0.4)",
            color: "#ef4444",
          }}
        >
          VS
        </span>
      </motion.div>

      {/* Defender from right */}
      <motion.div
        initial={{ x: "100vw", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute right-[10%] md:right-[15%] text-center z-10"
      >
        <div
          className="w-20 h-20 md:w-28 md:h-28 rounded-full mx-auto mb-3 border-2"
          style={{
            backgroundColor: battle.defender.color + "33",
            borderColor: battle.defender.color,
            boxShadow: `0 0 30px ${battle.defender.color}80`,
          }}
        />
        <p className="text-white font-bold text-lg md:text-xl font-[family-name:var(--font-orbitron)]">
          {battle.defender.name}
        </p>
      </motion.div>

      {/* Round subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-[80px] text-white/40 text-xs tracking-widest font-[family-name:var(--font-orbitron)] z-10"
      >
        {roundTitle}
      </motion.p>
    </div>
  );
}

function BattleScene2D({
  battle,
  animIndex,
  onDone,
}: {
  battle: BattlePair;
  animIndex: number;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 4500);
    return () => clearTimeout(t);
  }, [onDone]);

  const particles = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 60,
      y: 50 + (Math.random() - 0.5) * 60,
      size: Math.random() * 6 + 2,
      delay: Math.random() * 1.5,
      duration: Math.random() * 1 + 0.8,
    }));
  }, []);

  const effectColors = [
    ["#ef4444", "#f97316"],
    ["#3b82f6", "#8b5cf6"],
    ["#06b6d4", "#22d3ee"],
    ["#f59e0b", "#ef4444"],
    ["#8b5cf6", "#ec4899"],
  ];
  const [c1, c2] = effectColors[animIndex % effectColors.length];

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Flash effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0, 0.3, 0] }}
        transition={{ duration: 1.5, times: [0, 0.1, 0.3, 0.5, 0.7] }}
        className="absolute inset-0 z-0"
        style={{ background: `radial-gradient(circle, ${c1}40, transparent 70%)` }}
      />

      {/* Clash center burst */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 3, 5], opacity: [0, 1, 0] }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute w-32 h-32 rounded-full z-10"
        style={{
          background: `radial-gradient(circle, ${c1}, ${c2}, transparent)`,
          filter: "blur(8px)",
        }}
      />

      {/* Expanding ring */}
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 8, opacity: 0 }}
        transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
        className="absolute w-24 h-24 rounded-full border-2 z-10"
        style={{ borderColor: c1 }}
      />
      <motion.div
        initial={{ scale: 0, opacity: 0.6 }}
        animate={{ scale: 6, opacity: 0 }}
        transition={{ duration: 1.8, delay: 0.6, ease: "easeOut" }}
        className="absolute w-20 h-20 rounded-full border z-10"
        style={{ borderColor: c2 }}
      />

      {/* Particles flying out */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{
            x: (p.x - 50) * 15,
            y: (p.y - 50) * 15,
            scale: 0,
            opacity: 0,
          }}
          transition={{ duration: p.duration, delay: p.delay + 0.2, ease: "easeOut" }}
          className="absolute rounded-full z-20"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.id % 2 === 0 ? c1 : c2,
            boxShadow: `0 0 ${p.size * 2}px ${p.id % 2 === 0 ? c1 : c2}`,
            left: "50%",
            top: "50%",
          }}
        />
      ))}

      {/* Team names during battle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0.8, 0] }}
        transition={{ duration: 4, times: [0, 0.2, 0.7, 1] }}
        className="absolute top-[30%] text-2xl md:text-3xl font-bold text-white z-30 font-[family-name:var(--font-orbitron)]"
        style={{ textShadow: `0 0 20px ${battle.attacker.color}` }}
      >
        {battle.attacker.name}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0.6, 0] }}
        transition={{ duration: 4, times: [0, 0.3, 0.7, 1] }}
        className="absolute bottom-[30%] text-xl md:text-2xl font-bold text-white/60 z-30 font-[family-name:var(--font-orbitron)]"
      >
        {battle.defender.name}
      </motion.p>

      {/* Screen shake simulation */}
      <motion.div
        animate={{ x: [0, -3, 3, -2, 2, 0], y: [0, 2, -3, 1, -1, 0] }}
        transition={{ duration: 0.5, delay: 0.1, repeat: 2 }}
        className="absolute inset-0 z-0"
      />
    </div>
  );
}

function VictoryScene2D({
  battle,
  onDone,
}: {
  battle: BattlePair;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  const confetti = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1,
      duration: Math.random() * 2 + 1.5,
      size: Math.random() * 6 + 3,
      color: ["#4F46E5", "#7C3AED", "#06B6D4", "#F59E0B", "#EF4444", "#22C55E"][i % 6],
    }));
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
      {/* Glow background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 1 }}
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${battle.attacker.color}40, transparent 70%)`,
        }}
      />

      {/* Winner badge */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
        className="z-10 text-center"
      >
        <div
          className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto mb-4 border-4 flex items-center justify-center"
          style={{
            borderColor: battle.attacker.color,
            boxShadow: `0 0 40px ${battle.attacker.color}80, 0 0 80px ${battle.attacker.color}40`,
            backgroundColor: battle.attacker.color + "22",
          }}
        >
          <span className="text-3xl md:text-4xl">&#9734;</span>
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl md:text-5xl font-bold text-white font-[family-name:var(--font-orbitron)]"
          style={{ textShadow: `0 0 30px ${battle.attacker.color}` }}
        >
          {battle.attacker.name}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-3 text-xl md:text-2xl font-bold text-green-400 font-[family-name:var(--font-orbitron)]"
        >
          +{battle.attacker.scoreChange} puan
        </motion.p>
      </motion.div>

      {/* Confetti */}
      {confetti.map((c) => (
        <motion.div
          key={c.id}
          initial={{ y: -20, x: `${c.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: 0.6, rotate: 360 }}
          transition={{ duration: c.duration, delay: c.delay, ease: "linear" }}
          className="absolute top-0 z-20"
          style={{
            width: c.size,
            height: c.size,
            backgroundColor: c.color,
            borderRadius: c.id % 3 === 0 ? "50%" : "0",
          }}
        />
      ))}
    </div>
  );
}

function Starfield() {
  const stars = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      duration: Math.random() * 3 + 2,
    }));
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      {stars.map((s) => (
        <motion.div
          key={s.id}
          initial={{ opacity: s.opacity }}
          animate={{ opacity: [s.opacity, s.opacity * 2, s.opacity] }}
          transition={{ duration: s.duration, repeat: Infinity }}
          className="absolute rounded-full bg-white"
          style={{
            width: s.size,
            height: s.size,
            left: `${s.x}%`,
            top: `${s.y}%`,
          }}
        />
      ))}
    </div>
  );
}

export default function CinematicOverlay({
  visible,
  phase,
  onPhaseComplete,
}: CinematicOverlayProps) {
  return (
    <AnimatePresence>
      {visible && phase && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999]"
          style={{ backgroundColor: "#000000" }}
        >
          {/* Letterbox bars */}
          <div className="absolute top-0 left-0 right-0 h-[50px] bg-black z-50" />
          <div className="absolute bottom-0 left-0 right-0 h-[50px] bg-black z-50" />

          {/* Scene content */}
          {phase.type === "intro" && (
            <IntroScene2D roundTitle={phase.roundTitle} onDone={onPhaseComplete} />
          )}
          {phase.type === "vs" && (
            <VSScene2D battle={phase.battle} roundTitle={phase.roundTitle} onDone={onPhaseComplete} />
          )}
          {phase.type === "battle" && (
            <BattleScene2D battle={phase.battle} animIndex={phase.animIndex} onDone={onPhaseComplete} />
          )}
          {phase.type === "victory" && (
            <VictoryScene2D battle={phase.battle} onDone={onPhaseComplete} />
          )}

          {/* Watermark */}
          <div className="absolute bottom-[55px] right-4 z-[60] opacity-40">
            <span className="text-white/30 text-[10px] font-[family-name:var(--font-orbitron)] tracking-widest">
              BUGFIX
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
