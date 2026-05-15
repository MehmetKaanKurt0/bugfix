"use client";

import { useRef, useEffect, useState, useCallback } from "react";

const COLORS = ["#4F46E5", "#7C3AED", "#06B6D4", "#6366F1", "#8B5CF6"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
}

export default function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animRef = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const count = isMobile ? 60 : 120;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

  const initParticles = useCallback(
    (w: number, h: number) => {
      const particles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          radius: Math.random() * 1.5 + 0.5,
        });
      }
      particlesRef.current = particles;
    },
    [count]
  );

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (particlesRef.current.length === 0) {
        initParticles(window.innerWidth, window.innerHeight);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouse);

    const connectionDist = isMobile ? 100 : 140;
    const mouseRepelDist = 120;

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const particles = particlesRef.current;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRepelDist && dist > 1) {
          const force = (1 - dist / mouseRepelDist) * 2;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.3;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, [reducedMotion, initParticles, isMobile]);

  if (reducedMotion) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(79,70,229,0.15) 0%, rgba(124,58,237,0.08) 40%, #0B0D1A 70%)",
        }}
      />
    );
  }

  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(79,70,229,0.12) 0%, rgba(124,58,237,0.06) 40%, #0B0D1A 70%)",
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ pointerEvents: "none" }}
      />
    </>
  );
}
