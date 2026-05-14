import {
  playBoom,
  playCrackling,
  playPewPew,
  playMeteor,
  playPortal,
  playVS,
  playConfetti,
} from "@/lib/sounds";
import { useAppStore } from "@/lib/store";

export type SoundEffect =
  | "boom"
  | "crackling"
  | "pewpew"
  | "meteor"
  | "portal"
  | "vs"
  | "confetti"
  | "impact"
  | "charge"
  | "whoosh";

const soundMap: Record<string, () => void> = {
  boom: playBoom,
  crackling: playCrackling,
  pewpew: playPewPew,
  meteor: playMeteor,
  portal: playPortal,
  vs: playVS,
  confetti: playConfetti,
  impact: playBoom,
  charge: playCrackling,
  whoosh: playPewPew,
};

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playReverb(fn: () => void) {
  fn();
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(100, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}

export const audioManager = {
  play(effect: SoundEffect, options?: { delay?: number; reverb?: boolean }) {
    if (!useAppStore.getState().soundEnabled) return;

    const fn = soundMap[effect];
    if (!fn) return;

    const exec = () => {
      if (options?.reverb) {
        playReverb(fn);
      } else {
        fn();
      }
    };

    if (options?.delay) {
      setTimeout(exec, options.delay);
    } else {
      exec();
    }
  },

  playForBattle(animIndex: number) {
    const effects: SoundEffect[] = ["boom", "crackling", "meteor", "pewpew", "portal"];
    this.play(effects[animIndex % effects.length], { delay: 800, reverb: true });
  },

  playForPhase(phaseType: string, animIndex?: number) {
    switch (phaseType) {
      case "vs":
        this.play("vs");
        break;
      case "battle":
        if (animIndex !== undefined) this.playForBattle(animIndex);
        break;
      case "victory":
        this.play("confetti", { delay: 500 });
        break;
    }
  },

  isEnabled() {
    return useAppStore.getState().soundEnabled;
  },
};
