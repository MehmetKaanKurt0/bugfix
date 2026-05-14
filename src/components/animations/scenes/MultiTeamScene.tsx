"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import ParticleSystem from "../effects/ParticleSystem";
import type { BattlePair } from "../CinematicOverlay";

interface MultiTeamSceneProps {
  battles: BattlePair[];
  progress: number;
}

function BattleCell({
  battle,
  offset,
  scale,
  progress,
}: {
  battle: BattlePair;
  offset: [number, number, number];
  scale: number;
  progress: number;
}) {
  const attackerRef = useRef<THREE.Mesh>(null);
  const defenderRef = useRef<THREE.Mesh>(null);

  const chargePhase = progress < 0.3;
  const clashPhase = progress >= 0.3 && progress < 0.6;
  const resultPhase = progress >= 0.6;

  useFrame(() => {
    if (attackerRef.current) {
      const ax = chargePhase
        ? -2 * scale + (progress / 0.3) * 0.5 * scale
        : clashPhase
        ? -1.5 * scale + ((progress - 0.3) / 0.3) * 1.5 * scale
        : 0;
      attackerRef.current.position.set(offset[0] + ax, offset[1], offset[2]);
      attackerRef.current.rotation.y += 0.02;

      if (resultPhase) {
        const t = (progress - 0.6) / 0.4;
        attackerRef.current.scale.setScalar(scale * (1 + t * 0.3));
      }
    }

    if (defenderRef.current) {
      const dx = chargePhase
        ? 2 * scale - (progress / 0.3) * 0.5 * scale
        : clashPhase
        ? 1.5 * scale - ((progress - 0.3) / 0.3) * 1.5 * scale
        : resultPhase
        ? ((progress - 0.6) / 0.4) * 3 * scale
        : 0;
      defenderRef.current.position.set(offset[0] + dx, offset[1], offset[2]);
      defenderRef.current.rotation.y -= 0.02;

      if (resultPhase) {
        const t = (progress - 0.6) / 0.4;
        defenderRef.current.scale.setScalar(scale * Math.max(1 - t * 0.5, 0.3));
      }
    }
  });

  const sphereSize = 0.5 * scale;
  const clashPoint = clashPhase && progress >= 0.5;

  return (
    <group>
      <mesh ref={attackerRef} position={[offset[0] - 2 * scale, offset[1], offset[2]]}>
        <sphereGeometry args={[sphereSize, 24, 24]} />
        <meshStandardMaterial
          color={battle.attacker.color}
          metalness={0.7}
          roughness={0.2}
          emissive={battle.attacker.color}
          emissiveIntensity={chargePhase ? 0.3 + (progress / 0.3) * 0.5 : 0.5}
        />
      </mesh>

      <mesh ref={defenderRef} position={[offset[0] + 2 * scale, offset[1], offset[2]]}>
        <sphereGeometry args={[sphereSize, 24, 24]} />
        <meshStandardMaterial
          color={battle.defender.color}
          metalness={0.7}
          roughness={0.2}
          emissive={battle.defender.color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {clashPoint && (
        <ParticleSystem
          count={30}
          colors={[battle.attacker.color, "#FFFFFF", "#FFD700"]}
          velocity={3}
          gravity={-2}
          lifetime={0.6}
          size={0.02 * scale}
          origin={[offset[0], offset[1], offset[2]]}
        />
      )}

      {resultPhase && (
        <Text
          position={[offset[0], offset[1] + 1.2 * scale, offset[2]]}
          fontSize={0.25 * scale}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
                  >
          {`+${battle.attacker.scoreChange}`}
        </Text>
      )}
    </group>
  );
}

export default function MultiTeamScene({ battles, progress }: MultiTeamSceneProps) {
  const cols = battles.length <= 2 ? battles.length : 2;
  const rows = Math.ceil(battles.length / cols);
  const cellScale = battles.length <= 2 ? 0.8 : 0.55;

  const positions: [number, number, number][] = battles.map((_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const xSpacing = 8;
    const ySpacing = 5;
    const x = (col - (cols - 1) / 2) * xSpacing;
    const y = ((rows - 1) / 2 - row) * ySpacing;
    return [x, y, 0];
  });

  return (
    <group>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 5, 5]} intensity={1} color="#7C3AED" />

      <Text
        position={[0, rows > 1 ? 4.5 : 3.5, 0]}
        fontSize={0.4}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
                outlineWidth={0.02}
        outlineColor="#7C3AED"
      >
        {progress < 0.3 ? "HAZIRLAN" : progress < 0.6 ? "SAVAŞ!" : "SONUÇ"}
      </Text>

      {battles.map((battle, i) => (
        <BattleCell
          key={i}
          battle={battle}
          offset={positions[i]}
          scale={cellScale}
          progress={progress}
        />
      ))}

      {/* Grid divider lines */}
      {battles.length > 2 && (
        <>
          <mesh position={[0, 0, -0.1]}>
            <planeGeometry args={[0.02, 10]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.1} />
          </mesh>
          {rows > 1 && (
            <mesh position={[0, 0, -0.1]} rotation={[0, 0, Math.PI / 2]}>
              <planeGeometry args={[0.02, 16]} />
              <meshBasicMaterial color="#FFFFFF" transparent opacity={0.1} />
            </mesh>
          )}
        </>
      )}
    </group>
  );
}
