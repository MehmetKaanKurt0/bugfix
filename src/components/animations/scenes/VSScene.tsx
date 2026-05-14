"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { easeOutCubic, easeOutElastic } from "../utils/easing";
import ParticleSystem from "../effects/ParticleSystem";

interface VSSceneProps {
  attacker: { name: string; color: string };
  defender: { name: string; color: string };
  roundTitle: string;
  progress: number;
}

function TeamSphere({
  color,
  name,
  side,
  progress,
}: {
  color: string;
  name: string;
  side: "left" | "right";
  progress: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const dir = side === "left" ? -1 : 1;
  const slideProgress = easeOutCubic(Math.min(progress / 0.4, 1));
  const targetX = dir * 3.5;
  const startX = dir * 12;

  useFrame(() => {
    if (!groupRef.current || !sphereRef.current) return;
    groupRef.current.position.x = startX + (targetX - startX) * slideProgress;
    sphereRef.current.rotation.y += 0.008;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={sphereRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.7}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>

      <Text
        fontSize={0.35}
        color="#FFFFFF"
        anchorX="center"
        anchorY="top"
        position={[0, -1.5, 0]}

        outlineWidth={0.01}
        outlineColor={color}
      >
        {name}
        <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
      </Text>

      <Text
        fontSize={0.9}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        position={[0, 0, 1.01]}
      >
        {name.charAt(0).toUpperCase()}
        <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
      </Text>

      <pointLight
        color={color}
        intensity={2}
        distance={6}
        position={[0, 0, 2]}
      />
    </group>
  );
}

export default function VSScene({
  attacker,
  defender,
  roundTitle,
  progress,
}: VSSceneProps) {
  const vsRef = useRef<THREE.Group>(null);
  const vsProgress = progress > 0.3 ? easeOutElastic(Math.min((progress - 0.3) / 0.3, 1)) : 0;
  const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

  useFrame(({ camera }) => {
    camera.position.set(0, 0, 10);
    camera.rotation.z = Math.sin(progress * Math.PI) * 0.03;

    if (vsRef.current) {
      const s = vsProgress * 1.5;
      vsRef.current.scale.setScalar(s * fadeOut);
      vsRef.current.rotation.z = Math.sin(progress * 10) * 0.02 * (1 - progress);
    }
  });

  return (
    <group>
      <ambientLight intensity={0.05} />

      <spotLight
        color="#3B82F6"
        intensity={3}
        position={[-8, 5, 5]}
        angle={0.5}
        penumbra={0.8}
      />
      <spotLight
        color="#EF4444"
        intensity={3}
        position={[8, 5, 5]}
        angle={0.5}
        penumbra={0.8}
      />

      <TeamSphere
        color={attacker.color}
        name={attacker.name}
        side="left"
        progress={progress}
      />

      <TeamSphere
        color={defender.color}
        name={defender.name}
        side="right"
        progress={progress}
      />

      <group ref={vsRef} position={[0, 0, 1]}>
        <Text
          fontSize={2.5}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
  
          outlineWidth={0.05}
          outlineColor="#FF8C00"
        >
          VS
          <meshStandardMaterial
            color="#FFD700"
            metalness={0.9}
            roughness={0.1}
            emissive="#FF8C00"
            emissiveIntensity={0.5}
          />
        </Text>
        <pointLight color="#FFD700" intensity={5} distance={8} />
      </group>

      {progress > 0.3 && progress < 0.9 && (
        <ParticleSystem
          count={80}
          colors={["#FFD700", "#FF8C00", "#FFFFFF"]}
          velocity={3}
          gravity={-1}
          lifetime={1}
          size={0.03}
          origin={[0, 0, 1]}
        />
      )}

      <group position={[0, -3.5, 0]}>
        <Text
          fontSize={0.2}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
  
          letterSpacing={0.3}
        >
          {roundTitle}
          <meshBasicMaterial color="#FFFFFF" toneMapped={false} opacity={0.3 * fadeOut} transparent />
        </Text>
      </group>
    </group>
  );
}
