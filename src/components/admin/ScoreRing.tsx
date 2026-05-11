"use client";

import { useEffect, useState } from "react";

function getColor(score: number) {
  if (score >= 90) return { stroke: "#EAB308", glow: "rgba(234,179,8,0.3)" };
  if (score >= 70) return { stroke: "#22C55E", glow: "rgba(34,197,94,0.3)" };
  if (score >= 40) return { stroke: "#F59E0B", glow: "rgba(245,158,11,0.3)" };
  return { stroke: "#EF4444", glow: "rgba(239,68,68,0.3)" };
}

export default function ScoreRing({ score }: { score: number }) {
  const [display, setDisplay] = useState(0);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (display / 100) * circumference;
  const { stroke, glow } = getColor(score);

  useEffect(() => {
    let frame: number;
    const duration = 1500;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * score));
      if (t < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="80" cy="80" r={radius} fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{
            transition: "stroke-dashoffset 0.1s ease-out",
            filter: `drop-shadow(0 0 8px ${glow})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-5xl font-bold font-mono"
          style={{ color: stroke }}
        >
          {display}
        </span>
        <span className="text-white/30 text-xs mt-1">/ 100</span>
      </div>
    </div>
  );
}
