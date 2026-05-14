"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { easeOutElastic } from "../utils/easing";

interface TextEffectProps {
  text: string;
  position?: [number, number, number];
  color?: string;
  fontSize?: number;
  active: boolean;
  animation?: "scale" | "typewriter" | "shake";
  glowColor?: string;
  duration?: number;
}

export default function TextEffect({
  text,
  position = [0, 0, 0],
  color = "#FFFFFF",
  fontSize = 1,
  active,
  animation = "scale",
  glowColor,
  duration = 1,
}: TextEffectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef(0);
  const started = useRef(false);
  const displayText = useRef("");

  useFrame(({ clock }) => {
    if (!active || !groupRef.current) return;

    if (!started.current) {
      startTime.current = clock.elapsedTime;
      started.current = true;
    }

    const elapsed = clock.elapsedTime - startTime.current;
    const t = Math.min(elapsed / duration, 1);

    if (animation === "scale") {
      const s = easeOutElastic(Math.min(t * 2, 1));
      groupRef.current.scale.setScalar(s);
      groupRef.current.position.set(position[0], position[1], position[2]);
    } else if (animation === "shake") {
      const s = easeOutElastic(Math.min(t * 2, 1));
      groupRef.current.scale.setScalar(s);
      if (t < 0.5) {
        groupRef.current.rotation.z = (Math.random() - 0.5) * 0.1 * (1 - t * 2);
      } else {
        groupRef.current.rotation.z = 0;
      }
    } else if (animation === "typewriter") {
      const chars = Math.floor(t * text.length * 1.5);
      displayText.current = text.slice(0, Math.min(chars, text.length));
    }

    if (t > 0.7) {
      const fadeT = (t - 0.7) / 0.3;
      groupRef.current.scale.setScalar(groupRef.current.scale.x * (1 - fadeT * 0.3));
    }
  });

  if (!active) {
    started.current = false;
    return null;
  }

  return (
    <group ref={groupRef} position={position}>
      <Text
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Orbitron-Bold.ttf"
        outlineWidth={fontSize * 0.02}
        outlineColor={glowColor || color}
      >
        {animation === "typewriter" ? displayText.current : text}
        <meshBasicMaterial
          color={color}
          toneMapped={false}
        />
      </Text>
      {glowColor && (
        <pointLight
          color={glowColor}
          intensity={3}
          distance={8}
        />
      )}
    </group>
  );
}
