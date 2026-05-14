"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import ParticleSystem from "../effects/ParticleSystem";
import ScreenShake from "../effects/ScreenShake";
import { easeOutCubic, easeOutElastic } from "../utils/easing";

interface PortalSceneProps {
  attacker: { name: string; color: string };
  defender: { name: string; color: string };
  progress: number;
}

function PortalRing({
  position,
  scale,
  progress,
  color,
}: {
  position: [number, number, number];
  scale: number;
  progress: number;
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.scale.setScalar(scale);
    groupRef.current.children.forEach((child, i) => {
      child.rotation.z += (0.02 + i * 0.01) * (i % 2 === 0 ? 1 : -1);
    });
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <torusGeometry args={[1, 0.06, 16, 64]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh rotation-x={0.5}>
        <torusGeometry args={[1.15, 0.03, 16, 64]} />
        <meshBasicMaterial color="#06B6D4" toneMapped={false} />
      </mesh>
      <mesh rotation-y={0.3}>
        <torusGeometry args={[1.3, 0.02, 16, 64]} />
        <meshBasicMaterial color="#FFFFFF" toneMapped={false} transparent opacity={0.4} />
      </mesh>
      {/* Portal inner surface */}
      <mesh>
        <circleGeometry args={[0.95, 32]} />
        <meshBasicMaterial
          color="#7C3AED"
          transparent
          opacity={0.3 + Math.sin(progress * 10) * 0.1}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight color={color} intensity={3 * scale} distance={5} />
    </group>
  );
}

export default function PortalScene({ attacker, defender, progress }: PortalSceneProps) {
  const attackerRef = useRef<THREE.Mesh>(null);
  const defenderRef = useRef<THREE.Mesh>(null);

  const openPhase = progress < 0.25;
  const suckPhase = progress >= 0.25 && progress < 0.55;
  const fallPhase = progress >= 0.55 && progress < 0.75;
  const closePhase = progress >= 0.75;

  const portalScale = openPhase
    ? easeOutElastic(progress / 0.25) * 1.5
    : closePhase
      ? Math.max(1.5 * (1 - (progress - 0.75) / 0.25), 0.001)
      : 1.5;

  const suckT = suckPhase ? (progress - 0.25) / 0.3 : 0;
  const fallT = fallPhase ? (progress - 0.55) / 0.2 : 0;

  useFrame(({ camera }) => {
    camera.position.set(0, 0, 10);

    if (attackerRef.current) {
      if (suckPhase) {
        const x = -3.5 + (0 - (-3.5)) * easeOutCubic(suckT);
        const scale = 1 - suckT * 0.7;
        attackerRef.current.position.set(x, 0, 0);
        attackerRef.current.scale.setScalar(Math.max(scale, 0.001));
        attackerRef.current.rotation.y += suckT * 0.3;
      } else if (fallPhase || closePhase) {
        const exitT = easeOutElastic(Math.min(fallT * 2, 1));
        attackerRef.current.position.set(0, 4 - 4 * exitT, 0);
        attackerRef.current.scale.setScalar(0.3 + exitT * 0.7);
      } else {
        attackerRef.current.position.set(-3.5, 0, 0);
        attackerRef.current.rotation.y += 0.01;
      }
    }

    if (defenderRef.current) {
      if (fallPhase) {
        defenderRef.current.position.y = -fallT * 5;
        defenderRef.current.scale.setScalar(Math.max(1 - fallT * 0.5, 0.001));
        defenderRef.current.rotation.z += fallT * 0.2;
      } else {
        defenderRef.current.position.set(3.5, 0, 0);
        defenderRef.current.rotation.y += 0.01;
      }
    }
  });

  return (
    <group>
      <ambientLight intensity={0.08} />

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

      {/* Main portal */}
      <PortalRing
        position={[0, 0, 0]}
        scale={portalScale}
        progress={progress}
        color="#7C3AED"
      />

      {/* Exit portal (appears during suck phase) */}
      {(suckPhase || fallPhase) && (
        <PortalRing
          position={[0, 4, 0]}
          scale={portalScale * 0.7}
          progress={progress}
          color="#06B6D4"
        />
      )}

      {/* Particles flowing into portal */}
      {(openPhase || suckPhase) && (
        <ParticleSystem
          count={80}
          colors={["#7C3AED", "#06B6D4", "#FFFFFF"]}
          velocity={2}
          gravity={0}
          lifetime={1.5}
          size={0.03}
          origin={[0, 0, 0]}
        />
      )}

      {/* Impact dust when defender falls */}
      {fallPhase && fallT > 0.5 && (
        <ParticleSystem
          count={40}
          colors={["#666666", "#888888", "#AAAAAA"]}
          velocity={2}
          gravity={-1}
          lifetime={0.8}
          size={0.04}
          origin={[3.5, -3, 0]}
        />
      )}

      <ScreenShake intensity={0.08} active={suckPhase && suckT > 0.8} />
    </group>
  );
}
