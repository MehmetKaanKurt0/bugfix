import type { BattleAnimation, BattleActor } from "./types";
import {
  createBurst, updateParticles, drawParticles,
  drawAvatar, drawImpactText, sleep, easeIn,
  type Particle,
} from "../utils/particles";

const DEBRIS_COLORS = ["#666", "#444", "#888", "#5a4a3a", "#7a6a5a"];

export const MeteorAnimation: BattleAnimation = {
  name: "meteor",
  async play(canvas, ctx, attacker: BattleActor, defender: BattleActor) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const aX = w * 0.25, aY = cy + 40;
    const dX = w * 0.75, dY = cy + 40;

    const startX = w * 0.9, startY = -30;
    const targetX = dX, targetY = dY - 50;

    let trail: Particle[] = [];
    let debris: Particle[] = [];
    let shockwave1 = { radius: 0, alpha: 0 };
    let shockwave2 = { radius: 0, alpha: 0 };
    const cracks: { x1: number; y1: number; x2: number; y2: number; alpha: number }[] = [];
    let impactText = { scale: 0, alpha: 0, phase: 0 };
    let flashAlpha = 0;

    const flightDuration = 1200;
    const startTime = performance.now();

    await new Promise<void>((resolve) => {
      function drawScene(now: number) {
        const elapsed = now - startTime;
        ctx.clearRect(0, 0, w, h);

        drawAvatar(ctx, aX, aY, 40, attacker.color, attacker.name);
        drawAvatar(ctx, dX, dY, 40, defender.color, defender.name);

        if (elapsed < flightDuration) {
          const t = easeIn(elapsed / flightDuration);
          const mx = startX + (targetX - startX) * t;
          const my = startY + (targetY - startY) * t;

          // Trail
          for (let j = 0; j < 3; j++) {
            const trailColors = ["#FF4500", "#FF6347", "#FFD700"];
            trail.push({
              x: mx + (Math.random() - 0.5) * 10,
              y: my + (Math.random() - 0.5) * 10,
              vx: (Math.random() - 0.5) * 1 + 1.5,
              vy: (Math.random() - 0.5) * 1 - 1,
              radius: 1.5 + Math.random() * 3,
              color: trailColors[j % 3],
              alpha: 0.8,
              decay: 0.015,
              gravity: 0.01,
            });
          }
          trail = updateParticles(trail);
          drawParticles(ctx, trail);

          // Meteor body
          const gradient = ctx.createRadialGradient(mx, my, 0, mx, my, 25);
          gradient.addColorStop(0, "#FFD700");
          gradient.addColorStop(0.4, "#FF6347");
          gradient.addColorStop(1, "rgba(255,69,0,0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(mx, my, 25, 0, Math.PI * 2);
          ctx.fill();

          requestAnimationFrame(drawScene);
        } else if (elapsed < flightDuration + 60) {
          // Flash
          drawParticles(ctx, trail);
          flashAlpha = 1 - (elapsed - flightDuration) / 60;
          ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
          ctx.fillRect(0, 0, w, h);

          if (debris.length === 0) {
            debris = createBurst(targetX, targetY, 50, DEBRIS_COLORS, {
              gravity: 0.15,
              decay: 0.01,
              shape: "square",
            });
            shockwave1 = { radius: 5, alpha: 1 };
            shockwave2 = { radius: 5, alpha: 0.7 };
            impactText = { scale: 0, alpha: 1, phase: 0 };

            // Generate cracks
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI * 2 * i) / 6 + (Math.random() - 0.5) * 0.4;
              const len = 40 + Math.random() * 60;
              cracks.push({
                x1: targetX, y1: targetY,
                x2: targetX + Math.cos(angle) * len,
                y2: targetY + Math.sin(angle) * len,
                alpha: 1,
              });
            }
          }
          requestAnimationFrame(drawScene);
        } else {
          const afterElapsed = elapsed - flightDuration - 60;

          trail = updateParticles(trail);
          drawParticles(ctx, trail);
          debris = updateParticles(debris);
          drawParticles(ctx, debris);

          // Shockwaves
          for (const sw of [shockwave1, shockwave2]) {
            if (sw.alpha > 0) {
              sw.radius += 6;
              sw.alpha -= 0.012;
              ctx.strokeStyle = `rgba(255, 140, 0, ${Math.max(0, sw.alpha)})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(targetX, targetY, sw.radius, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
          shockwave2.radius += 2;

          // Cracks
          for (const c of cracks) {
            c.alpha = Math.max(0, c.alpha - 0.005);
            ctx.strokeStyle = `rgba(150, 130, 100, ${c.alpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(c.x1, c.y1);
            ctx.lineTo(c.x2, c.y2);
            ctx.stroke();
          }

          // Impact text
          if (impactText.alpha > 0) {
            if (impactText.phase === 0) {
              impactText.scale = Math.min(impactText.scale + 0.12, 1.5);
              if (impactText.scale >= 1.5) impactText.phase = 1;
            } else if (impactText.phase === 1) {
              impactText.scale += (1 - impactText.scale) * 0.15;
              if (Math.abs(impactText.scale - 1) < 0.05) impactText.phase = 2;
            } else {
              if (afterElapsed > 1200) impactText.alpha -= 0.03;
            }
            drawImpactText(ctx, "CRASH!", cx, cy - 40, impactText.scale, impactText.alpha, "#fff", "#FF4500");
          }

          if (afterElapsed < 2200) {
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
