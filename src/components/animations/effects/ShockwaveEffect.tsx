"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ShockwaveProps {
  position: [number, number, number];
  active: boolean;
  color?: string;
  maxScale?: number;
  duration?: number;
}

export default function ShockwaveEffect({
  position,
  active,
  color = "#FFFFFF",
  maxScale = 8,
  duration = 1,
}: ShockwaveProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const startTime = useRef(0);
  const started = useRef(false);

  useFrame(({ clock }) => {
    if (!active || !ringRef.current) return;

    if (!started.current) {
      startTime.current = clock.elapsedTime;
      started.current = true;
    }

    const elapsed = clock.elapsedTime - startTime.current;
    const t = Math.min(elapsed / duration, 1);

    const scale = t * maxScale;
    const opacity = Math.max(0, 1 - t);

    ringRef.current.scale.set(scale, scale, 1);
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = opacity * 0.6;

    if (ring2Ref.current) {
      const t2 = Math.min(Math.max(elapsed - 0.1, 0) / (duration * 1.3), 1);
      const scale2 = t2 * maxScale * 1.2;
      ring2Ref.current.scale.set(scale2, scale2, 1);
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - t2) * 0.3;
    }
  });

  if (!active) return null;

  return (
    <group position={position}>
      <mesh ref={ringRef} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={ring2Ref} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.6, 0.8, 32]} />
        <meshBasicMaterial
          color="#FF8C00"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
