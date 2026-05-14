"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import ParticleSystem from "../effects/ParticleSystem";
import { easeOutElastic } from "../utils/easing";

interface VictorySceneProps {
  winner: { name: string; color: string };
  scoreChange: number;
  progress: number;
}

function ConfettiParticles({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <>
      <ParticleSystem
        count={200}
        colors={["#FFD700", "#FF6B6B", "#4F46E5", "#06B6D4", "#10B981", "#EC4899"]}
        velocity={4}
        gravity={-3}
        lifetime={3}
        size={0.06}
        origin={[0, 5, 0]}
        mode="burst"
      />
      <ParticleSystem
        count={100}
        colors={["#FFD700", "#FFFFFF", "#FF8C00"]}
        velocity={2}
        gravity={-1}
        lifetime={2.5}
        size={0.04}
        origin={[0, 0, 0]}
      />
    </>
  );
}

export default function VictoryScene({ winner, scoreChange, progress }: VictorySceneProps) {
  const sphereRef = useRef<THREE.Mesh>(null);

  const sphereScale = easeOutElastic(Math.min(progress / 0.3, 1)) * 1.5;
  const textScale = progress > 0.2 ? easeOutElastic(Math.min((progress - 0.2) / 0.3, 1)) : 0;
  const glowIntensity = progress > 0.15 ? 2 + Math.sin(progress * 8) * 1 : 0;
  const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

  useFrame(({ camera }) => {
    camera.position.set(0, 0, 10);

    if (sphereRef.current) {
      sphereRef.current.scale.setScalar(sphereScale * fadeOut);
      sphereRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.1} />

      {/* Winner sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={winner.color}
          metalness={0.6}
          roughness={0.2}
          emissive={winner.color}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Initial letter */}
      <Text
        fontSize={1.2}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        position={[0, 0, sphereScale * 0.7]}
      >
        {winner.name.charAt(0).toUpperCase()}
        <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
      </Text>

      {/* Light burst */}
      <pointLight
        color={winner.color}
        intensity={glowIntensity * fadeOut}
        distance={15}
        position={[0, 0, 2]}
      />

      {/* Score text */}
      <group position={[0, -2.5, 0]} scale={textScale * fadeOut}>
        <Text
          fontSize={1.5}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"

          outlineWidth={0.03}
          outlineColor="#FF8C00"
        >
          {`+${scoreChange} PUAN!`}
          <meshBasicMaterial color="#FFD700" toneMapped={false} />
        </Text>
        <pointLight color="#FFD700" intensity={3 * fadeOut} distance={6} />
      </group>

      {/* Winner name */}
      {progress > 0.1 && (
        <group position={[0, 2.2, 0]} scale={textScale * fadeOut}>
          <Text
            fontSize={0.5}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
  
            outlineWidth={0.01}
            outlineColor={winner.color}
          >
            {winner.name}
            <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
          </Text>
        </group>
      )}

      {/* Crown */}
      {progress > 0.3 && (
        <group position={[0, sphereScale + 0.8, 0]} scale={textScale * 0.7 * fadeOut}>
          <Text fontSize={1} anchorX="center" anchorY="middle">
            👑
          </Text>
        </group>
      )}

      <ConfettiParticles active={progress > 0.15} />

      {/* Gold rain */}
      {progress > 0.2 && (
        <ParticleSystem
          count={150}
          colors={["#FFD700", "#FFC107", "#FF8C00"]}
          velocity={1}
          gravity={-2}
          lifetime={2}
          size={0.03}
          origin={[0, 6, 0]}
          mode="continuous"
        />
      )}
    </group>
  );
}
