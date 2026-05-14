"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

import IntroScene from "./scenes/IntroScene";
import VSScene from "./scenes/VSScene";
import BombScene from "./scenes/BombScene";
import LightningScene from "./scenes/LightningScene";
import MeteorScene from "./scenes/MeteorScene";
import LaserScene from "./scenes/LaserScene";
import PortalScene from "./scenes/PortalScene";
import VictoryScene from "./scenes/VictoryScene";

export interface BattlePair {
  attacker: { name: string; color: string; scoreChange: number };
  defender: { name: string; color: string };
}

export type ScenePhase =
  | { type: "intro"; roundTitle: string; duration: number }
  | { type: "vs"; battle: BattlePair; roundTitle: string; duration: number }
  | { type: "battle"; battle: BattlePair; animIndex: number; duration: number }
  | { type: "victory"; battle: BattlePair; duration: number };

interface CinematicOverlayProps {
  visible: boolean;
  phase: ScenePhase | null;
  onPhaseComplete: () => void;
}

const BATTLE_SCENES = [BombScene, LightningScene, MeteorScene, LaserScene, PortalScene];

function SceneRenderer({
  phase,
  onPhaseComplete,
  onImpact,
}: {
  phase: ScenePhase;
  onPhaseComplete: () => void;
  onImpact: (active: boolean) => void;
}) {
  const startTime = useRef(0);
  const completed = useRef(false);
  const impactTriggered = useRef(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    startTime.current = 0;
    completed.current = false;
    impactTriggered.current = false;
    setProgress(0);
    onImpact(false);
  }, [phase, onImpact]);

  useFrame(({ clock }) => {
    if (completed.current) return;

    if (startTime.current === 0) {
      startTime.current = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - startTime.current;
    const p = Math.min(elapsed / phase.duration, 1);
    setProgress(p);

    if (phase.type === "battle" && p >= 0.4 && p <= 0.7 && !impactTriggered.current) {
      impactTriggered.current = true;
      onImpact(true);
      setTimeout(() => onImpact(false), 600);
    }

    if (p >= 1 && !completed.current) {
      completed.current = true;
      onPhaseComplete();
    }
  });

  switch (phase.type) {
    case "intro":
      return <IntroScene roundTitle={phase.roundTitle} progress={progress} />;
    case "vs":
      return (
        <VSScene
          attacker={phase.battle.attacker}
          defender={phase.battle.defender}
          roundTitle={phase.roundTitle}
          progress={progress}
        />
      );
    case "battle": {
      const BattleComponent = BATTLE_SCENES[phase.animIndex % BATTLE_SCENES.length];
      return (
        <BattleComponent
          attacker={phase.battle.attacker}
          defender={phase.battle.defender}
          progress={progress}
        />
      );
    }
    case "victory":
      return (
        <VictoryScene
          winner={phase.battle.attacker}
          scoreChange={phase.battle.attacker.scoreChange}
          progress={progress}
        />
      );
    default:
      return null;
  }
}

export default function CinematicOverlay({
  visible,
  phase,
  onPhaseComplete,
}: CinematicOverlayProps) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [impactActive, setImpactActive] = useState(false);
  const chromaticOffset = impactActive ? new THREE.Vector2(0.012, 0.012) : new THREE.Vector2(0.001, 0.001);

  return (
    <AnimatePresence>
      {visible && phase && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999]"
          style={{ backgroundColor: "#000000" }}
        >
          {/* Letterbox bars */}
          <div className="absolute top-0 left-0 right-0 h-[50px] bg-black z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-[50px] bg-black z-10" />

          {/* Three.js Canvas */}
          <Canvas
            camera={{ position: [0, 0, 10], fov: 60 }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.2,
            }}
            dpr={isMobile ? [1, 1.5] : [1, 2]}
            style={{ position: "absolute", inset: 0 }}
          >
            <color attach="background" args={["#000000"]} />

            <SceneRenderer phase={phase} onPhaseComplete={onPhaseComplete} onImpact={setImpactActive} />

            <EffectComposer>
              <Bloom
                luminanceThreshold={0.2}
                luminanceSmoothing={0.9}
                intensity={1.5}
                mipmapBlur={!isMobile}
              />
              <ChromaticAberration
                offset={chromaticOffset}
                radialModulation={false}
                modulationOffset={0.5}
                blendFunction={BlendFunction.NORMAL}
              />
              <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.15} />
              <Vignette eskil={false} offset={0.1} darkness={0.8} />
            </EffectComposer>
          </Canvas>

          {/* Watermark */}
          <div className="absolute bottom-[55px] right-4 z-20 opacity-40">
            <span className="text-white/30 text-[10px] font-[family-name:var(--font-orbitron)] tracking-widest">
              BUGFIX
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
