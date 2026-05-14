"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleSystemProps {
  count: number;
  colors: string[];
  spread?: number;
  velocity?: number;
  gravity?: number;
  lifetime?: number;
  size?: number;
  emissiveIntensity?: number;
  origin?: [number, number, number];
  active?: boolean;
  mode?: "burst" | "continuous" | "implode";
}

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export default function ParticleSystem({
  count,
  colors,
  velocity = 3,
  gravity = -2,
  lifetime = 2,
  size = 0.05,
  origin = [0, 0, 0],
  active = true,
  mode = "burst",
}: ParticleSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const startTime = useRef(performance.now());
  const initialized = useRef(false);

  const particles = useMemo(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const c = isMobile ? Math.floor(count * 0.5) : count;
    return Array.from({ length: c }, () => {
      const angle = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = (0.5 + Math.random()) * velocity;
      return {
        px: origin[0],
        py: origin[1],
        pz: origin[2],
        vx: Math.sin(phi) * Math.cos(angle) * speed,
        vy: Math.sin(phi) * Math.sin(angle) * speed * (mode === "implode" ? -1 : 1),
        vz: Math.cos(phi) * speed * 0.5,
        life: 0,
        maxLife: (0.5 + Math.random() * 0.5) * lifetime,
        scale: (0.5 + Math.random()) * size,
        colorIdx: Math.floor(Math.random() * colors.length),
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, colors.length, velocity, lifetime, size, origin, mode]);

  useFrame(() => {
    if (!meshRef.current || !active) return;
    const mesh = meshRef.current;
    const dt = 0.016;

    if (!initialized.current) {
      startTime.current = performance.now();
      initialized.current = true;
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.life += dt;

      if (p.life > p.maxLife) {
        _dummy.scale.setScalar(0);
        _dummy.position.set(0, -100, 0);
        _dummy.updateMatrix();
        mesh.setMatrixAt(i, _dummy.matrix);
        continue;
      }

      p.vx *= 0.99;
      p.vy += gravity * dt;
      p.vz *= 0.99;

      p.px += p.vx * dt;
      p.py += p.vy * dt;
      p.pz += p.vz * dt;

      const lifeRatio = p.life / p.maxLife;
      const s = p.scale * (1 - lifeRatio);

      _dummy.position.set(p.px, p.py, p.pz);
      _dummy.scale.setScalar(Math.max(s, 0.001));
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);

      _color.set(colors[p.colorIdx]);
      mesh.setColorAt(i, _color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial toneMapped={false} vertexColors>
        <primitive attach="emissive" object={new THREE.Color(1, 1, 1)} />
      </meshBasicMaterial>
    </instancedMesh>
  );
}
