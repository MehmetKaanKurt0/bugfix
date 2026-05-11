import type { BattleAnimation, BattleActor } from "./types";
import {
  createBurst, updateParticles, drawParticles,
  drawAvatar, drawImpactText, sleep,
  type Particle,
} from "../utils/particles";

export const LaserAnimation: BattleAnimation = {
  name: "laser",
  async play(canvas, ctx, attacker: BattleActor, defender: BattleActor) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const aX = w * 0.25, aY = cy;
    const dX = w * 0.75, dY = cy;
    const chargeX = aX + 55, chargeY = aY;

    let chargeParticles: Particle[] = [];
    let burstParticles: Particle[] = [];
    let beamAlpha = 0;
    let beamWidth = 0;
    let impactText = { scale: 0, alpha: 0, phase: 0 };
    let sparkles: Particle[] = [];

    const chargeDuration = 800;
    const beamDuration = 400;
    const totalDuration = 3000;
    const startTime = performance.now();

    await new Promise<void>((resolve) => {
      function drawScene(now: number) {
        const elapsed = now - startTime;
        ctx.clearRect(0, 0, w, h);

        drawAvatar(ctx, aX, aY, 40, attacker.color, attacker.name);
        drawAvatar(ctx, dX, dY, 40, defender.color, defender.name);

        if (elapsed < chargeDuration) {
          // Charge-up: particles spiral inward
          const t = elapsed / chargeDuration;
          const count = Math.floor(t * 20);

          for (let i = chargeParticles.length; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 40;
            chargeParticles.push({
              x: chargeX + Math.cos(angle) * dist,
              y: chargeY + Math.sin(angle) * dist,
              vx: 0, vy: 0,
              radius: 2 + Math.random() * 2,
              color: attacker.color,
              alpha: 0.8,
              decay: 0,
              gravity: 0,
            });
          }

          // Move particles toward center
          for (const p of chargeParticles) {
            const dx = chargeX - p.x;
            const dy = chargeY - p.y;
            p.x += dx * 0.06;
            p.y += dy * 0.06;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 5) p.alpha -= 0.05;
          }
          chargeParticles = chargeParticles.filter((p) => p.alpha > 0);
          drawParticles(ctx, chargeParticles);

          // Charge glow
          const glowSize = 5 + t * 15;
          const gradient = ctx.createRadialGradient(chargeX, chargeY, 0, chargeX, chargeY, glowSize);
          gradient.addColorStop(0, `rgba(255,255,255,${t * 0.8})`);
          gradient.addColorStop(0.5, attacker.color + Math.round(t * 80).toString(16).padStart(2, "0"));
          gradient.addColorStop(1, "transparent");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(chargeX, chargeY, glowSize, 0, Math.PI * 2);
          ctx.fill();

          requestAnimationFrame(drawScene);
        } else if (elapsed < chargeDuration + beamDuration) {
          // Beam firing
          const bt = (elapsed - chargeDuration) / beamDuration;

          // Beam reaches target
          const beamEndX = chargeX + (dX - 50 - chargeX) * Math.min(bt * 3, 1);

          // Pulse width
          beamWidth = 6 + Math.sin(bt * Math.PI * 6) * 4;
          beamAlpha = 1;

          // Beam glow
          ctx.save();
          ctx.shadowColor = attacker.color;
          ctx.shadowBlur = 20;
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = attacker.color;
          ctx.fillRect(chargeX, chargeY - beamWidth * 1.5, beamEndX - chargeX, beamWidth * 3);
          ctx.restore();

          // Beam core
          ctx.fillStyle = "#fff";
          ctx.globalAlpha = beamAlpha;
          ctx.fillRect(chargeX, chargeY - beamWidth / 2, beamEndX - chargeX, beamWidth);
          ctx.globalAlpha = 1;

          // Sparkles along beam
          if (Math.random() > 0.3) {
            sparkles.push({
              x: chargeX + Math.random() * (beamEndX - chargeX),
              y: chargeY + (Math.random() - 0.5) * beamWidth * 2,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              radius: 1 + Math.random() * 1.5,
              color: "#fff",
              alpha: 0.8,
              decay: 0.04,
              gravity: 0,
            });
          }
          sparkles = updateParticles(sparkles);
          drawParticles(ctx, sparkles);

          // Impact burst when beam reaches target
          if (bt > 0.33 && burstParticles.length === 0) {
            burstParticles = createBurst(dX - 40, dY, 40, [attacker.color, "#fff", "#FFD700"], {
              gravity: 0.05,
            });
            impactText = { scale: 0, alpha: 1, phase: 0 };
          }

          burstParticles = updateParticles(burstParticles);
          drawParticles(ctx, burstParticles);

          requestAnimationFrame(drawScene);
        } else {
          // Aftermath
          const afterElapsed = elapsed - chargeDuration - beamDuration;

          // Fading beam
          beamAlpha = Math.max(0, 1 - afterElapsed / 300);
          if (beamAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = beamAlpha * 0.3;
            ctx.fillStyle = attacker.color;
            ctx.fillRect(chargeX, chargeY - 8, dX - 50 - chargeX, 16);
            ctx.restore();

            ctx.globalAlpha = beamAlpha;
            ctx.fillStyle = "#fff";
            ctx.fillRect(chargeX, chargeY - 2, dX - 50 - chargeX, 4);
            ctx.globalAlpha = 1;
          }

          sparkles = updateParticles(sparkles);
          drawParticles(ctx, sparkles);
          burstParticles = updateParticles(burstParticles);
          drawParticles(ctx, burstParticles);

          // Impact text
          if (impactText.alpha > 0) {
            if (impactText.phase === 0) {
              impactText.scale = Math.min(impactText.scale + 0.15, 1.5);
              if (impactText.scale >= 1.5) impactText.phase = 1;
            } else if (impactText.phase === 1) {
              impactText.scale += (1 - impactText.scale) * 0.2;
              if (Math.abs(impactText.scale - 1) < 0.05) impactText.phase = 2;
            } else {
              if (afterElapsed > 1000) impactText.alpha -= 0.03;
            }
            drawImpactText(ctx, "BEAM!", cx, cy - 40, impactText.scale, impactText.alpha, "#fff", attacker.color);
          }

          if (elapsed < totalDuration) {
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
