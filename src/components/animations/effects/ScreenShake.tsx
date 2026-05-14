"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

interface ScreenShakeProps {
  intensity: number;
  active: boolean;
  decay?: number;
}

export default function ScreenShake({
  intensity,
  active,
  decay = 5,
}: ScreenShakeProps) {
  const { camera } = useThree();
  const currentIntensity = useRef(0);
  const basePos = useRef({ x: 0, y: 0 });
  const initialized = useRef(false);

  useFrame((_, delta) => {
    if (active && !initialized.current) {
      basePos.current = { x: camera.position.x, y: camera.position.y };
      currentIntensity.current = intensity;
      initialized.current = true;
    }

    if (!active) {
      initialized.current = false;
      return;
    }

    if (currentIntensity.current > 0.001) {
      camera.position.x = basePos.current.x + (Math.random() - 0.5) * currentIntensity.current;
      camera.position.y = basePos.current.y + (Math.random() - 0.5) * currentIntensity.current;
      currentIntensity.current *= Math.pow(0.1, delta * decay);
    } else {
      camera.position.x = basePos.current.x;
      camera.position.y = basePos.current.y;
    }
  });

  return null;
}
