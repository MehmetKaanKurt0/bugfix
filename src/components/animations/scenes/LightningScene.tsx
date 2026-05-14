"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import ScreenShake from "../effects/ScreenShake";
import ParticleSystem from "../effects/ParticleSystem";

interface LightningSceneProps {
  attacker: { name: string; color: string };
  defender: { name: string; color: string };
  progress: number;
}

function LightningBolt({ from, to, active }: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  active: boolean;
}) {
  const lineRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    if (!active) return new THREE.BufferGeometry();
    const points: THREE.Vector3[] = [];
    const segments = 12;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = new THREE.Vector3().lerpVectors(from, to, t);
      if (i > 0 && i < segments) {
        p.x += (Math.random() - 0.5) * 1.5;
        p.z += (Math.random() - 0.5) * 0.5;
      }
      points.push(p);
    }

    const verts: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      verts.push(points[i].x, points[i].y, points[i].z);
      verts.push(points[i + 1].x, points[i + 1].y, points[i + 1].z);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return geo;
  }, [from, to, active]);

  if (!active) return null;

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color="#FFFFFF" linewidth={2} toneMapped={false} />
    </lineSegments>
  );
}

export default function LightningScene({ attacker, defender, progress }: LightningSceneProps) {
  const attackerRef = useRef<THREE.Mesh>(null);
  const defenderRef = useRef<THREE.Mesh>(null);
  const [struck, setStruck] = useState(false);

  const darkenPhase = progress < 0.25;
  const strikePhase = progress >= 0.25 && progress < 0.4;
  const electricPhase = progress >= 0.4 && progress < 0.7;
  const fadePhase = progress >= 0.7;

  const ambientIntensity = darkenPhase ? 0.3 * (1 - progress / 0.25 * 0.9) : fadePhase ? 0.03 + (progress - 0.7) / 0.3 * 0.27 : 0.03;
  const flashIntensity = strikePhase ? 30 * (1 - (progress - 0.25) / 0.15) : 0;

  const defenderPos = new THREE.Vector3(3.5, 0, 0);
  const lightningFrom = new THREE.Vector3(3.5 + (Math.random() - 0.5) * 2, 8, 0);

  useFrame(() => {
    if (attackerRef.current) {
      attackerRef.current.position.set(-4, 0, 0);
      attackerRef.current.rotation.y += 0.01;
    }
    if (defenderRef.current) {
      defenderRef.current.position.copy(defenderPos);
      if (electricPhase) {
        defenderRef.current.position.x += (Math.random() - 0.5) * 0.15;
        defenderRef.current.position.y += (Math.random() - 0.5) * 0.15;
      }
      defenderRef.current.rotation.y += 0.01;
    }
    if (strikePhase && !struck) setStruck(true);
  });

  return (
    <group>
      <ambientLight intensity={ambientIntensity} />
      <pointLight color="#00BFFF" intensity={flashIntensity} position={[3.5, 4, 2]} />

      {darkenPhase && (
        <group position={[0, 7, -3]}>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={i} position={[(i - 4) * 2.5, Math.random() * 2, -2 + Math.random() * 3]}>
              <sphereGeometry args={[2 + Math.random() * 2, 8, 8]} />
              <meshBasicMaterial color="#1a1a2e" transparent opacity={0.5 * (progress / 0.25)} />
            </mesh>
          ))}
        </group>
      )}

      <mesh ref={attackerRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color={attacker.color}
          metalness={0.7}
          roughness={0.2}
          emissive={attacker.color}
          emissiveIntensity={0.3}
        />
      </mesh>

      <mesh ref={defenderRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color={defender.color}
          metalness={0.7}
          roughness={0.2}
          emissive={electricPhase ? "#00BFFF" : defender.color}
          emissiveIntensity={electricPhase ? 0.5 + Math.random() * 0.5 : 0.2}
        />
      </mesh>

      <LightningBolt
        from={lightningFrom}
        to={defenderPos}
        active={strikePhase || electricPhase}
      />

      {(strikePhase || electricPhase) && (
        <>
          <LightningBolt
            from={new THREE.Vector3(lightningFrom.x + 1, 7, 0.5)}
            to={new THREE.Vector3(defenderPos.x + 0.5, defenderPos.y + 0.5, 0)}
            active={true}
          />
          <LightningBolt
            from={new THREE.Vector3(lightningFrom.x - 0.5, 7.5, -0.3)}
            to={new THREE.Vector3(defenderPos.x - 0.3, defenderPos.y - 0.3, 0)}
            active={true}
          />
        </>
      )}

      {struck && (
        <ParticleSystem
          count={60}
          colors={["#FFFFFF", "#00BFFF", "#87CEEB"]}
          velocity={4}
          gravity={-3}
          lifetime={0.8}
          size={0.02}
          origin={[3.5, 0, 0]}
        />
      )}

      <ScreenShake intensity={0.15} active={strikePhase} />
    </group>
  );
}
