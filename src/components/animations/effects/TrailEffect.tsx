"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TrailProps {
  target: React.RefObject<THREE.Object3D | null>;
  length?: number;
  colors?: string[];
  active?: boolean;
  width?: number;
}

const _dummy = new THREE.Object3D();

export default function TrailEffect({
  target,
  length = 50,
  colors = ["#FFFFFF", "#FFDD44", "#FF8800", "#FF4400", "#881100"],
  active = true,
  width = 0.05,
}: TrailProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const positions = useMemo(
    () => Array.from({ length }, () => new THREE.Vector3(0, -100, 0)),
    [length]
  );

  const colorArray = useMemo(
    () => colors.map((c) => new THREE.Color(c)),
    [colors]
  );

  useFrame(() => {
    if (!meshRef.current || !target.current || !active) return;

    const mesh = meshRef.current;
    const pos = target.current.position;

    for (let i = positions.length - 1; i > 0; i--) {
      positions[i].copy(positions[i - 1]);
    }
    positions[0].copy(pos);

    for (let i = 0; i < positions.length; i++) {
      const t = i / positions.length;
      const s = width * (1 - t * 0.8);
      const colorIdx = Math.min(
        Math.floor(t * colorArray.length),
        colorArray.length - 1
      );

      _dummy.position.copy(positions[i]);
      _dummy.scale.setScalar(Math.max(s, 0.001));
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
      mesh.setColorAt(i, colorArray[colorIdx]);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, length]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial toneMapped={false} vertexColors />
    </instancedMesh>
  );
}
