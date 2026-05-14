"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "./Confetti";
import { playConfetti } from "@/lib/sounds";
import { useAppStore } from "@/lib/store";

interface ScoreCelebrationProps {
  active: boolean;
  teamName: string;
  teamColor: string;
  score: number;
  onComplete: () => void;
}

export default function ScoreCelebration({
  active,
  teamName,
  teamColor,
  score,
  onComplete,
}: ScoreCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!active) return;

    const soundOn = useAppStore.getState().soundEnabled;
    if (soundOn) playConfetti();

    setShowConfetti(true);
    const confettiTimer = setTimeout(() => setShowConfetti(false), 3200);
    const closeTimer = setTimeout(() => onComplete(), 3500);

    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(closeTimer);
    };
  }, [active, onComplete]);

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
          >
            <div className="flex flex-col items-center">
              {/* Team avatar */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: [0, 1.3, 1], rotate: [-20, 5, 0] }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl md:text-4xl"
                style={{
                  backgroundColor: teamColor,
                  boxShadow: `0 0 40px ${teamColor}66, 0 0 80px ${teamColor}33`,
                }}
              >
                {teamName.charAt(0).toUpperCase()}
              </motion.div>

              {/* Team name */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-white font-semibold text-lg md:text-xl"
              >
                {teamName}
              </motion.p>

              {/* Score */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: [0.5, 1.2, 1] }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-3"
              >
                <span
                  className="text-5xl md:text-7xl font-black font-[family-name:var(--font-orbitron)]"
                  style={{
                    background: "linear-gradient(135deg, #FFD700, #FF8C00)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 20px rgba(255,215,0,0.4))",
                  }}
                >
                  +{score}
                </span>
              </motion.div>

              {/* Label */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-2 text-white/40 text-sm tracking-widest font-[family-name:var(--font-orbitron)]"
              >
                PUAN KAZANDI!
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Confetti active={showConfetti} />
    </>
  );
}
