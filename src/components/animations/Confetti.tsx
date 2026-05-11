"use client";

import { useEffect, useRef, useCallback } from "react";

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  gravity: number;
}

const COLORS = [
  "#FFD700", "#FF6B6B", "#4F46E5", "#06B6D4", "#7C3AED",
  "#10B981", "#F59E0B", "#EC4899", "#6366F1", "#8B5CF6",
];

export default function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const piecesRef = useRef<ConfettiPiece[]>([]);
  const animRef = useRef<number>(0);

  const spawn = useCallback(() => {
    const pieces: ConfettiPiece[] = [];
    const w = window.innerWidth;
    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * w,
        y: -(Math.random() * 200 + 20),
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        gravity: 0.06 + Math.random() * 0.04,
      });
    }
    piecesRef.current = pieces;
  }, []);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.scale(dpr, dpr);

    spawn();
    const startTime = performance.now();
    const duration = 3000;

    function draw(now: number) {
      const elapsed = now - startTime;
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      ctx!.clearRect(0, 0, cw, ch);

      const alpha = elapsed > duration - 500 ? Math.max(0, (duration - elapsed) / 500) : 1;
      ctx!.globalAlpha = alpha;

      for (const p of piecesRef.current) {
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.vx *= 0.99;
        p.rotation += p.rotSpeed;

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx!.restore();
      }

      ctx!.globalAlpha = 1;

      if (elapsed < duration) {
        animRef.current = requestAnimationFrame(draw);
      }
    }

    animRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animRef.current);
  }, [active, spawn]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[60] pointer-events-none"
    />
  );
}
