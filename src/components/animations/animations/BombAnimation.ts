import type { BattleAnimation, BattleActor } from "./types";
import {
  createBurst, updateParticles, drawParticles,
  drawAvatar, drawImpactText, sleep, lerp, easeInOut,
  type Particle,
} from "../utils/particles";

const FIRE_COLORS = ["#FF4500", "#FF6347", "#FFD700", "#FF8C00"];

export const BombAnimation: BattleAnimation = {
  name: "bomb",
  async play(canvas, ctx, attacker: BattleActor, defender: BattleActor) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const aX = w * 0.25, aY = cy;
    const dX = w * 0.75, dY = cy;

    let particles: Particle[] = [];
    let trail: Particle[] = [];
    let shakeTimer = 0;
    let impactText = { scale: 0, alpha: 0, phase: 0 };
    let flashAlpha = 0;
    let shockwave = { radius: 0, alpha: 0, active: false };

    // Phase 1: Bomb flight (0 - 1.5s)
    const flightDuration = 1500;
    const startTime = performance.now();

    await new Promise<void>((resolve) => {
      function drawScene(now: number) {
        const elapsed = now - startTime;
        ctx.clearRect(0, 0, w, h);

        // Avatars
        const shake = shakeTimer > 0
          ? { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 }
          : { x: 0, y: 0 };

        drawAvatar(ctx, aX, aY, 40, attacker.color, attacker.name);
        drawAvatar(ctx, dX, dY, 40, defender.color, defender.name,
          shakeTimer > 0 ? shake : undefined);

        if (elapsed < flightDuration) {
          // Bomb in flight
          const t = easeInOut(elapsed / flightDuration);
          const bx = lerp(aX + 50, dX - 50, t);
          const arcHeight = -150;
          const by = lerp(aY, dY, t) + arcHeight * Math.sin(t * Math.PI);

          // Trail
          trail.push({
            x: bx, y: by,
            vx: (Math.random() - 0.5) * 0.5,
            vy: Math.random() * 0.5,
            radius: 2 + Math.random() * 2,
            color: "#888",
            alpha: 0.6,
            decay: 0.02,
            gravity: 0.02,
          });
          trail = updateParticles(trail);
          drawParticles(ctx, trail);

          // Bomb body
          ctx.fillStyle = "#444";
          ctx.beginPath();
          ctx.arc(bx, by, 12, 0, Math.PI * 2);
          ctx.fill();

          // Fuse
          const fuseGlow = 0.5 + Math.sin(elapsed * 0.02) * 0.5;
          ctx.strokeStyle = `rgba(255, 140, 0, ${fuseGlow})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(bx, by - 12);
          ctx.lineTo(bx + 5, by - 20);
          ctx.stroke();

          // Spark
          ctx.fillStyle = `rgba(255, 200, 0, ${fuseGlow})`;
          ctx.beginPath();
          ctx.arc(bx + 5, by - 20, 3, 0, Math.PI * 2);
          ctx.fill();

          requestAnimationFrame(drawScene);
        } else if (elapsed < flightDuration + 50) {
          // Flash
          flashAlpha = 1;
          ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
          ctx.fillRect(0, 0, w, h);
          particles = createBurst(dX, dY, 70, FIRE_COLORS, { gravity: 0.12 });
          shockwave = { radius: 5, alpha: 1, active: true };
          shakeTimer = 100;
          impactText = { scale: 0, alpha: 1, phase: 0 };
          requestAnimationFrame(drawScene);
        } else {
          // Explosion phase
          const explodeElapsed = elapsed - flightDuration - 50;

          particles = updateParticles(particles);
          drawParticles(ctx, particles);

          // Shockwave
          if (shockwave.active) {
            shockwave.radius += 8;
            shockwave.alpha -= 0.015;
            if (shockwave.alpha > 0) {
              ctx.strokeStyle = `rgba(255, 140, 0, ${shockwave.alpha})`;
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(dX, dY, shockwave.radius, 0, Math.PI * 2);
              ctx.stroke();
            }
          }

          // Shake
          if (shakeTimer > 0) {
            shakeTimer -= 16;
          }

          // Impact text
          if (impactText.alpha > 0) {
            if (impactText.phase === 0) {
              impactText.scale = Math.min(impactText.scale + 0.12, 1.5);
              if (impactText.scale >= 1.5) impactText.phase = 1;
            } else if (impactText.phase === 1) {
              impactText.scale = lerp(impactText.scale, 1, 0.15);
              if (Math.abs(impactText.scale - 1) < 0.05) impactText.phase = 2;
            } else {
              if (explodeElapsed > 1200) impactText.alpha -= 0.03;
            }
            drawImpactText(ctx, "BOOM!", cx, cy - 30, impactText.scale, impactText.alpha, "#fff", "#FF4500");
          }

          if (explodeElapsed < 2000) {
            requestAnimationFrame(drawScene);
          } else {
            resolve();
          }
        }
      }
      requestAnimationFrame(drawScene);
    });

    await sleep(200);
  },
};
