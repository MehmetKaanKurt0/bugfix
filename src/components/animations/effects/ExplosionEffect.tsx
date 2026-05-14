"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ExplosionProps {
  position: [number, number, number];
  active: boolean;
  colors?: string[];
  count?: number;
  force?: number;
}

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export default function ExplosionEffect({
  position,
  active,
  colors = ["#FF4500", "#FF6347", "#FFD700", "#FF8C00", "#FFFFFF"],
  count = 150,
  force = 6,
}: ExplosionProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const started = useRef(false);

  const particles = useMemo(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const c = isMobile ? Math.floor(count * 0.5) : count;
    return Array.from({ length: c }, () => {
      const angle = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = (1 + Math.random() * 2) * force;
      return {
        px: position[0], py: position[1], pz: position[2],
        vx: Math.sin(phi) * Math.cos(angle) * speed,
        vy: Math.sin(phi) * Math.sin(angle) * speed * 0.8 + 2,
        vz: Math.cos(phi) * speed * 0.3,
        life: 0,
        maxLife: 0.8 + Math.random() * 1.2,
        scale: 0.02 + Math.random() * 0.08,
        colorIdx: Math.floor(Math.random() * colors.length),
        rotSpeed: (Math.random() - 0.5) * 10,
      };
    });
  }, [position, colors.length, count, force]);

  useFrame(() => {
    if (!meshRef.current || !active) return;
    if (!started.current) {
      started.current = true;
      for (const p of particles) {
        p.px = position[0]; p.py = position[1]; p.pz = position[2];
        p.life = 0;
      }
    }

    const mesh = meshRef.current;
    const dt = 0.016;

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

      p.vy -= 5 * dt;
      p.vx *= 0.98;
      p.vz *= 0.98;
      p.px += p.vx * dt;
      p.py += p.vy * dt;
      p.pz += p.vz * dt;

      const lifeRatio = p.life / p.maxLife;
      const s = p.scale * (1 - lifeRatio * 0.7);

      _dummy.position.set(p.px, p.py, p.pz);
      _dummy.scale.setScalar(Math.max(s, 0.001));
      _dummy.rotation.z += p.rotSpeed * dt;
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
      <meshBasicMaterial toneMapped={false} vertexColors />
    </instancedMesh>
  );
}
