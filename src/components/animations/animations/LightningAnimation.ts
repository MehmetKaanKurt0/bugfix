import type { BattleAnimation, BattleActor } from "./types";
import {
  createBurst, updateParticles, drawParticles,
  drawAvatar, drawImpactText, sleep,
  type Particle,
} from "../utils/particles";

function generateBolt(x1: number, y1: number, x2: number, y2: number, segments: number) {
  const points: { x: number; y: number }[] = [{ x: x1, y: y1 }];
  const dx = (x2 - x1) / segments;
  const dy = (y2 - y1) / segments;
  for (let i = 1; i < segments; i++) {
    points.push({
      x: x1 + dx * i + (Math.random() - 0.5) * 80,
      y: y1 + dy * i + (Math.random() - 0.5) * 20,
    });
  }
  points.push({ x: x2, y: y2 });
  return points;
}

function drawBolt(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  alpha: number
) {
  // Glow layer
  ctx.save();
  ctx.globalAlpha = alpha * 0.4;
  ctx.strokeStyle = "#00BFFF";
  ctx.lineWidth = 8;
  ctx.shadowColor = "#00BFFF";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
  ctx.restore();

  // Core
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
  ctx.restore();
}

export const LightningAnimation: BattleAnimation = {
  name: "lightning",
  async play(canvas, ctx, attacker: BattleActor, defender: BattleActor) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const aX = w * 0.35, aY = h * 0.65;
    const dX = w * 0.65, dY = h * 0.65;
    const targetX = dX, targetY = dY - 50;

    let particles: Particle[] = [];
    let flashAlpha = 0;
    let vibrateTimer = 0;
    let impactText = { scale: 0, alpha: 0, phase: 0 };

    const mainBolt = generateBolt(cx, 0, targetX, targetY, 10);
    const branches = [
      generateBolt(mainBolt[3].x, mainBolt[3].y, mainBolt[3].x + 60, mainBolt[3].y + 40, 4),
      generateBolt(mainBolt[5].x, mainBolt[5].y, mainBolt[5].x - 50, mainBolt[5].y + 30, 4),
      generateBolt(mainBolt[7].x, mainBolt[7].y, mainBolt[7].x + 70, mainBolt[7].y + 50, 4),
    ];

    const strikeTime = 300;
    const totalDuration = 3000;
    const startTime = performance.now();

    await new Promise<void>((resolve) => {
      function drawScene(now: number) {
        const elapsed = now - startTime;
        ctx.clearRect(0, 0, w, h);

        const defShake = vibrateTimer > 0
          ? { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 }
          : undefined;

        drawAvatar(ctx, aX, aY, 40, attacker.color, attacker.name);
        drawAvatar(ctx, dX, dY, 40, defender.color, defender.name, defShake);

        if (elapsed < strikeTime) {
          // Lightning descending
          const progress = elapsed / strikeTime;
          const visiblePoints = Math.ceil(progress * mainBolt.length);
          const visible = mainBolt.slice(0, visiblePoints);
          if (visible.length > 1) {
            drawBolt(ctx, visible, 1);
          }
        } else if (elapsed < strikeTime + 80) {
          // Flash
          drawBolt(ctx, mainBolt, 1);
          branches.forEach((b) => drawBolt(ctx, b, 0.6));
          flashAlpha = 1 - (elapsed - strikeTime) / 80;
          ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
          ctx.fillRect(0, 0, w, h);

          if (particles.length === 0) {
            particles = createBurst(targetX, targetY, 35, ["#fff", "#87CEEB", "#00BFFF", "#E0FFFF"], {
              gravity: 0.05,
              decay: 0.02,
            });
            vibrateTimer = 500;
            impactText = { scale: 0, alpha: 1, phase: 0 };
          }
        } else {
          // Aftermath
          const afterElapsed = elapsed - strikeTime - 80;

          // Fading bolt
          const boltAlpha = Math.max(0, 1 - afterElapsed / 400);
          if (boltAlpha > 0) {
            drawBolt(ctx, mainBolt, boltAlpha);
            branches.forEach((b) => drawBolt(ctx, b, boltAlpha * 0.5));
          }

          particles = updateParticles(particles);
          drawParticles(ctx, particles);

          if (vibrateTimer > 0) vibrateTimer -= 16;

          // Impact text
          if (impactText.alpha > 0) {
            if (impactText.phase === 0) {
              impactText.scale = Math.min(impactText.scale + 0.15, 1.5);
              if (impactText.scale >= 1.5) impactText.phase = 1;
            } else if (impactText.phase === 1) {
              impactText.scale += (1 - impactText.scale) * 0.2;
              if (Math.abs(impactText.scale - 1) < 0.05) impactText.phase = 2;
            } else {
              if (afterElapsed > 1200) impactText.alpha -= 0.03;
            }
            drawImpactText(ctx, "ZAP!", cx, cy - 40, impactText.scale, impactText.alpha, "#00BFFF", "#0066FF");
          }
        }

        if (elapsed < totalDuration) {
          requestAnimationFrame(drawScene);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(drawScene);
    });

    await sleep(200);
  },
};
