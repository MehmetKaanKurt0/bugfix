"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const COLORS = ["#4F46E5", "#7C3AED", "#06B6D4", "#6366F1", "#8B5CF6"];

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

function Particles({ count }: { count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const linesRef = useRef<THREE.LineSegments>(null!);
  const mouseRef = useRef(new THREE.Vector2(9999, 9999));
  const mouse3D = useRef(new THREE.Vector3(9999, 9999, 0));
  const { viewport, camera } = useThree();

  const particles = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const velocities: THREE.Vector3[] = [];
    const colors: THREE.Color[] = [];
    for (let i = 0; i < count; i++) {
      positions.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 6
        )
      );
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.003
        )
      );
      colors.push(new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)]));
    }
    return { positions, velocities, colors };
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const maxLines = count * 6;
  const linePositions = useMemo(() => new Float32Array(maxLines * 6), [maxLines]);
  const lineColors = useMemo(() => new Float32Array(maxLines * 6), [maxLines]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseRef.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      mouse3D.current.set(
        mouseRef.current.x * (viewport.width / 2),
        mouseRef.current.y * (viewport.height / 2),
        0
      );
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [viewport, camera]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const globalRotation = time * 0.03;
    let lineIndex = 0;
    const connectionDistance = 2.2;
    const mouseRepelDistance = 2.5;
    const mouseRepelStrength = 0.04;

    for (let i = 0; i < count; i++) {
      const pos = particles.positions[i];
      const vel = particles.velocities[i];

      pos.add(vel);

      if (Math.abs(pos.x) > 6) vel.x *= -1;
      if (Math.abs(pos.y) > 4) vel.y *= -1;
      if (Math.abs(pos.z) > 3) vel.z *= -1;

      const dx = pos.x - mouse3D.current.x;
      const dy = pos.y - mouse3D.current.y;
      const distToMouse = Math.sqrt(dx * dx + dy * dy);
      if (distToMouse < mouseRepelDistance && distToMouse > 0.01) {
        const force = (1 - distToMouse / mouseRepelDistance) * mouseRepelStrength;
        pos.x += (dx / distToMouse) * force;
        pos.y += (dy / distToMouse) * force;
      }

      const rotatedX = pos.x * Math.cos(globalRotation) - pos.z * Math.sin(globalRotation);
      const rotatedZ = pos.x * Math.sin(globalRotation) + pos.z * Math.cos(globalRotation);

      dummy.position.set(rotatedX, pos.y, rotatedZ);
      const scale = 0.02 + Math.sin(time * 2 + i) * 0.008;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, particles.colors[i]);
    }

    for (let i = 0; i < count && lineIndex < maxLines; i++) {
      for (let j = i + 1; j < count && lineIndex < maxLines; j++) {
        const pi = particles.positions[i];
        const pj = particles.positions[j];
        const dist = pi.distanceTo(pj);
        if (dist < connectionDistance) {
          const alpha = 1 - dist / connectionDistance;
          const idx = lineIndex * 6;

          const rotI_x = pi.x * Math.cos(globalRotation) - pi.z * Math.sin(globalRotation);
          const rotI_z = pi.x * Math.sin(globalRotation) + pi.z * Math.cos(globalRotation);
          const rotJ_x = pj.x * Math.cos(globalRotation) - pj.z * Math.sin(globalRotation);
          const rotJ_z = pj.x * Math.sin(globalRotation) + pj.z * Math.cos(globalRotation);

          linePositions[idx] = rotI_x;
          linePositions[idx + 1] = pi.y;
          linePositions[idx + 2] = rotI_z;
          linePositions[idx + 3] = rotJ_x;
          linePositions[idx + 4] = pj.y;
          linePositions[idx + 5] = rotJ_z;

          const ci = particles.colors[i];
          const cj = particles.colors[j];
          lineColors[idx] = ci.r * alpha;
          lineColors[idx + 1] = ci.g * alpha;
          lineColors[idx + 2] = ci.b * alpha;
          lineColors[idx + 3] = cj.r * alpha;
          lineColors[idx + 4] = cj.g * alpha;
          lineColors[idx + 5] = cj.b * alpha;

          lineIndex++;
        }
      }
    }

    for (let i = lineIndex * 6; i < linePositions.length; i++) {
      linePositions[i] = 0;
      lineColors[i] = 0;
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    const lineGeo = linesRef.current.geometry;
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions.slice(0, lineIndex * 6), 3));
    lineGeo.setAttribute("color", new THREE.BufferAttribute(lineColors.slice(0, lineIndex * 6), 3));
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <lineSegments ref={linesRef} frustumCulled={false}>
        <bufferGeometry />
        <lineBasicMaterial vertexColors transparent opacity={0.4} toneMapped={false} />
      </lineSegments>
    </>
  );
}

export default function HeroScene() {
  const isMobile = useIsMobile();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (reducedMotion) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(79,70,229,0.15) 0%, rgba(124,58,237,0.08) 40%, #0B0D1A 70%)",
        }}
      />
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 60 }}
      dpr={[1, 1.5]}
      style={{ position: "absolute", inset: 0 }}
      gl={{ antialias: false, alpha: true }}
    >
      <Particles count={isMobile ? 100 : 400} />
    </Canvas>
  );
}
