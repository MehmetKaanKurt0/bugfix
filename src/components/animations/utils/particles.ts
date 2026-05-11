export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  shape?: "circle" | "square" | "triangle";
}

export function createParticle(opts: Partial<Particle> & { x: number; y: number }): Particle {
  return {
    vx: 0,
    vy: 0,
    radius: 3,
    color: "#fff",
    alpha: 1,
    decay: 0.015,
    gravity: 0,
    shape: "circle",
    ...opts,
  };
}

export function createBurst(
  x: number,
  y: number,
  count: number,
  colors: string[],
  opts?: Partial<Particle>
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 6;
    particles.push(
      createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        decay: 0.01 + Math.random() * 0.015,
        gravity: opts?.gravity ?? 0.08,
        ...opts,
      })
    );
  }
  return particles;
}

export function updateParticles(particles: Particle[]): Particle[] {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.alpha -= p.decay;
    p.vx *= 0.99;
  }
  return particles.filter((p) => p.alpha > 0.01);
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;

    if (p.shape === "square") {
      ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
    } else if (p.shape === "triangle") {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - p.radius);
      ctx.lineTo(p.x - p.radius, p.y + p.radius);
      ctx.lineTo(p.x + p.radius, p.y + p.radius);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  name: string,
  shake?: { x: number; y: number }
) {
  const isMobile = window.innerWidth < 768;
  const r = isMobile ? radius * 0.7 : radius;
  const sx = x + (shake?.x ?? 0);
  const sy = y + (shake?.y ?? 0);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = `bold ${r * 0.8}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name.charAt(0).toUpperCase(), sx, sy);

  ctx.font = `bold ${isMobile ? 11 : 14}px sans-serif`;
  ctx.fillText(name, sx, sy + r + (isMobile ? 14 : 20));
}

export function drawImpactText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale: number,
  alpha: number,
  color: string,
  glowColor: string
) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  const impactMobile = window.innerWidth < 768;
  ctx.font = `bold ${Math.round((impactMobile ? 48 : 72) * scale)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 30;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.restore();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeIn(t: number) {
  return t * t * t;
}

export function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
