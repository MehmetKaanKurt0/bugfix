"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import ExplosionEffect from "../effects/ExplosionEffect";
import ShockwaveEffect from "../effects/ShockwaveEffect";
import ScreenShake from "../effects/ScreenShake";
import TrailEffect from "../effects/TrailEffect";
import { lerp, easeInQuad, easeOutElastic } from "../utils/easing";

interface BombSceneProps {
  attacker: { name: string; color: string };
  defender: { name: string; color: string };
  progress: number;
}

export default function BombScene({ attacker, defender, progress }: BombSceneProps) {
  const attackerRef = useRef<THREE.Mesh>(null);
  const defenderRef = useRef<THREE.Mesh>(null);
  const bombRef = useRef<THREE.Mesh>(null);
  const [exploded, setExploded] = useState(false);

  const bombPhase = progress < 0.18 ? "spawn" : progress < 0.5 ? "fly" : "explode";
  const flyT = bombPhase === "fly" ? easeInQuad((progress - 0.18) / 0.32) : 0;
  const impactT = bombPhase === "explode" ? (progress - 0.5) / 0.5 : 0;
  const flashIntensity = bombPhase === "explode" && impactT < 0.05 ? 20 * (1 - impactT / 0.05) : 0;

  useFrame(({ camera }) => {
    camera.position.set(0, 0, 10);

    if (attackerRef.current) {
      attackerRef.current.position.set(-4, 0, 0);
      attackerRef.current.rotation.y += 0.01;
    }

    if (defenderRef.current) {
      if (bombPhase === "explode") {
        defenderRef.current.position.x = 4 + impactT * 3;
        defenderRef.current.scale.setScalar(Math.max(1 - impactT * 0.8, 0.001));
        defenderRef.current.rotation.z = impactT * Math.PI * 2;
      } else {
        defenderRef.current.position.set(4, 0, 0);
        defenderRef.current.rotation.y += 0.01;
      }
    }

    if (bombRef.current) {
      if (bombPhase === "spawn") {
        const t = easeOutElastic(progress / 0.18);
        bombRef.current.scale.setScalar(t * 0.6);
        bombRef.current.position.set(-3, 0.5, 0);
      } else if (bombPhase === "fly") {
        const x = lerp(-3, 4, flyT);
        const y = Math.sin(flyT * Math.PI) * 3 + 0.5;
        const z = Math.sin(flyT * Math.PI * 2) * 0.5;
        bombRef.current.position.set(x, y, z);
        bombRef.current.rotation.z -= 0.1;
        camera.position.x = x * 0.15;
        camera.position.y = y * 0.08;
      } else {
        bombRef.current.scale.setScalar(0);
        if (!exploded) setExploded(true);
      }
    }
  });

  return (
    <group>
      <ambientLight intensity={0.15} />
      <pointLight color="#FF8C00" intensity={flashIntensity} position={[4, 0, 2]} />

      {/* Attacker */}
      <mesh ref={attackerRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color={attacker.color}
          metalness={0.7}
          roughness={0.2}
          emissive={attacker.color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Defender */}
      <mesh ref={defenderRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color={defender.color}
          metalness={0.7}
          roughness={0.2}
          emissive={defender.color}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Bomb */}
      <mesh ref={bombRef}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#2D2D2D" metalness={0.8} roughness={0.3} />
        <pointLight color="#FF6600" intensity={bombPhase === "fly" ? 2 + Math.sin(progress * 30) * 1 : 1} distance={3} position={[0, 0.5, 0]} />
      </mesh>

      {bombPhase === "fly" && (
        <TrailEffect
          target={bombRef}
          length={40}
          colors={["#FF8800", "#FF4400", "#881100", "#440000"]}
          width={0.08}
        />
      )}

      <ExplosionEffect
        position={[4, 0, 0]}
        active={exploded}
        colors={["#FF4500", "#FF6347", "#FFD700", "#FF8C00", "#FFFFFF"]}
        count={150}
        force={6}
      />

      <ShockwaveEffect
        position={[4, 0, 0.1]}
        active={exploded}
        maxScale={8}
        duration={0.8}
      />

      <ScreenShake intensity={0.2} active={exploded && impactT < 0.3} />
    </group>
  );
}
