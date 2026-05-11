import type { BattleAnimation, BattleActor } from "./types";
import {
  updateParticles, drawParticles,
  drawAvatar, drawImpactText, sleep, easeOut,
  type Particle,
} from "../utils/particles";

export const PortalAnimation: BattleAnimation = {
  name: "portal",
  async play(canvas, ctx, attacker: BattleActor, defender: BattleActor) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const aX = w * 0.3, aY = cy + 20;
    const dX = w * 0.7, dY = cy + 20;

    let portalRadius = 0;
    let portalAlpha = 0;
    let portalRotation = 0;
    let portalParticles: Particle[] = [];
    let impactText = { scale: 0, alpha: 0, phase: 0 };

    // Avatar positions that animate
    const atkPos = { x: aX, y: aY, scale: 1 };
    const defPos = { x: dX, y: dY, scale: 1 };

    const openDuration = 800;
    const swapDuration = 1200;
    const closeDuration = 800;
    const totalDuration = openDuration + swapDuration + closeDuration + 800;
    const startTime = performance.now();

    await new Promise<void>((resolve) => {
      function drawPortal(x: number, y: number, radius: number, alpha: number, rotation: number) {
        if (radius < 2 || alpha <= 0) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        // Outer glow
        const gradient = ctx.createRadialGradient(0, 0, radius * 0.6, 0, 0, radius);
        gradient.addColorStop(0, `rgba(124, 58, 237, ${alpha * 0.3})`);
        gradient.addColorStop(0.7, `rgba(6, 182, 212, ${alpha * 0.15})`);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Ring
        ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
        ctx.stroke();

        // Inner ring
        ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.7})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.restore();
      }

      function drawScene(now: number) {
        const elapsed = now - startTime;
        ctx.clearRect(0, 0, w, h);
        portalRotation += 0.03;

        // Emit portal particles
        if (portalRadius > 10 && portalAlpha > 0.2) {
          const angle = Math.random() * Math.PI * 2;
          portalParticles.push({
            x: cx + Math.cos(angle) * portalRadius * 0.7,
            y: cy + Math.sin(angle) * portalRadius * 0.7,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            radius: 1 + Math.random() * 2,
            color: Math.random() > 0.5 ? "#7C3AED" : "#06B6D4",
            alpha: 0.6,
            decay: 0.015,
            gravity: 0,
          });
        }
        portalParticles = updateParticles(portalParticles);

        if (elapsed < openDuration) {
          // Phase 1: Portal opens
          const t = easeOut(elapsed / openDuration);
          portalRadius = t * 70;
          portalAlpha = t;

          drawAvatar(ctx, atkPos.x, atkPos.y, 40 * atkPos.scale, attacker.color, attacker.name);
          drawAvatar(ctx, defPos.x, defPos.y, 40 * defPos.scale, defender.color, defender.name);
          drawPortal(cx, cy, portalRadius, portalAlpha, portalRotation);
          drawParticles(ctx, portalParticles);

        } else if (elapsed < openDuration + swapDuration) {
          // Phase 2: Swap through portal
          const t = easeOut((elapsed - openDuration) / swapDuration);

          if (t < 0.4) {
            // Attacker shrinks into portal
            const st = t / 0.4;
            atkPos.x = aX + (cx - aX) * st;
            atkPos.y = aY + (cy - aY) * st;
            atkPos.scale = 1 - st * 0.8;
            defPos.x = dX;
            defPos.y = dY;
            defPos.scale = 1;
          } else if (t < 0.6) {
            // Both inside portal
            atkPos.scale = 0.2;
            defPos.x = dX + (cx - dX) * ((t - 0.4) / 0.2);
            defPos.y = dY + (cy - dY) * ((t - 0.4) / 0.2);
            defPos.scale = 1 - ((t - 0.4) / 0.2) * 0.8;
          } else {
            // Emerge at swapped positions
            const st = (t - 0.6) / 0.4;
            // Attacker emerges at defender's old position (higher rank)
            atkPos.x = cx + (dX - cx) * st;
            atkPos.y = cy + (dY - cy) * st;
            atkPos.scale = 0.2 + st * 0.8;
            // Defender drops down
            defPos.x = cx + (aX - cx) * st;
            defPos.y = cy + (aY - cy) * st;
            defPos.scale = 0.2 + st * 0.8;

            if (impactText.alpha === 0 && st > 0.5) {
              impactText = { scale: 0, alpha: 1, phase: 0 };
            }
          }

          drawAvatar(ctx, atkPos.x, atkPos.y, 40 * atkPos.scale, attacker.color, attacker.name);
          drawAvatar(ctx, defPos.x, defPos.y, 40 * defPos.scale, defender.color, defender.name);
          drawPortal(cx, cy, portalRadius, portalAlpha, portalRotation);
          drawParticles(ctx, portalParticles);

        } else if (elapsed < openDuration + swapDuration + closeDuration) {
          // Phase 3: Portal closes
          const t = (elapsed - openDuration - swapDuration) / closeDuration;
          portalRadius = 70 * (1 - t);
          portalAlpha = 1 - t;

          drawAvatar(ctx, dX, dY, 40, attacker.color, attacker.name);
          drawAvatar(ctx, aX, aY, 40, defender.color, defender.name);
          drawPortal(cx, cy, portalRadius, portalAlpha, portalRotation);
          drawParticles(ctx, portalParticles);

          // Impact text
          if (impactText.alpha > 0) {
            if (impactText.phase === 0) {
              impactText.scale = Math.min(impactText.scale + 0.12, 1.4);
              if (impactText.scale >= 1.4) impactText.phase = 1;
            } else if (impactText.phase === 1) {
              impactText.scale += (1 - impactText.scale) * 0.15;
              if (Math.abs(impactText.scale - 1) < 0.05) impactText.phase = 2;
            } else {
              if (t > 0.6) impactText.alpha -= 0.03;
            }
            drawImpactText(ctx, "SWAP!", cx, cy - 80, impactText.scale, impactText.alpha, "#fff", "#7C3AED");
          }
        } else {
          // Final state
          drawAvatar(ctx, dX, dY, 40, attacker.color, attacker.name);
          drawAvatar(ctx, aX, aY, 40, defender.color, defender.name);
          drawParticles(ctx, portalParticles);

          if (impactText.alpha > 0) {
            impactText.alpha -= 0.03;
            drawImpactText(ctx, "SWAP!", cx, cy - 80, 1, impactText.alpha, "#fff", "#7C3AED");
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
