"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import ExplosionEffect from "../effects/ExplosionEffect";
import ShockwaveEffect from "../effects/ShockwaveEffect";
import ScreenShake from "../effects/ScreenShake";
import TrailEffect from "../effects/TrailEffect";
import { easeInQuad } from "../utils/easing";

interface MeteorSceneProps {
  attacker: { name: string; color: string };
  defender: { name: string; color: string };
  progress: number;
}

export default function MeteorScene({ attacker, defender, progress }: MeteorSceneProps) {
  const attackerRef = useRef<THREE.Mesh>(null);
  const defenderRef = useRef<THREE.Mesh>(null);
  const meteorRef = useRef<THREE.Mesh>(null);
  const [impacted, setImpacted] = useState(false);

  const approachPhase = progress < 0.1;
  const flyPhase = progress >= 0.1 && progress < 0.5;
  const impactPhase = progress >= 0.5;
  const flyT = flyPhase ? easeInQuad((progress - 0.1) / 0.4) : impactPhase ? 1 : 0;
  const impactT = impactPhase ? (progress - 0.5) / 0.5 : 0;
  const flashIntensity = impactPhase && impactT < 0.05 ? 25 * (1 - impactT / 0.05) : 0;

  useFrame(({ camera }) => {
    camera.position.set(0, 0, 10);

    if (attackerRef.current) {
      attackerRef.current.position.set(-4, 0, 0);
      attackerRef.current.rotation.y += 0.01;
    }

    if (defenderRef.current) {
      if (impactPhase) {
        defenderRef.current.position.y = -impactT * 2;
        defenderRef.current.position.x = 4 + (Math.random() - 0.5) * impactT * 0.3;
        defenderRef.current.scale.setScalar(Math.max(1 - impactT * 0.9, 0.001));
      } else {
        defenderRef.current.position.set(4, 0, 0);
      }
      defenderRef.current.rotation.y += 0.01;
    }

    if (meteorRef.current) {
      if (approachPhase) {
        meteorRef.current.position.set(10, 8, 0);
        meteorRef.current.scale.setScalar(progress / 0.1 * 0.8);
      } else if (flyPhase) {
        const x = 10 + (4 - 10) * flyT;
        const y = 8 + (0 - 8) * flyT;
        meteorRef.current.position.set(x, y, 0);
        meteorRef.current.rotation.z -= 0.05;
        camera.position.x = (x - 7) * 0.1;
        camera.position.y = (y - 4) * 0.05;
      } else {
        meteorRef.current.scale.setScalar(0);
        if (!impacted) setImpacted(true);
      }
    }
  });

  return (
    <group>
      <ambientLight intensity={0.1} />
      <pointLight color="#FF4500" intensity={flashIntensity} position={[4, 0, 2]} />

      {/* Starfield */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={300}
            array={new Float32Array(Array.from({ length: 900 }, () => (Math.random() - 0.5) * 40))}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial color="#FFFFFF" size={0.05} transparent opacity={0.6} />
      </points>

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
          emissive={defender.color}
          emissiveIntensity={0.2}
        />
      </mesh>

      <mesh ref={meteorRef}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial
          color="#B22222"
          emissive="#FF4500"
          emissiveIntensity={2}
        />
        <pointLight color="#FF4500" intensity={4} distance={6} />
      </mesh>

      {flyPhase && (
        <TrailEffect
          target={meteorRef}
          length={60}
          colors={["#FFFFFF", "#FFDD44", "#FF8800", "#FF4400", "#881100"]}
          width={0.1}
        />
      )}

      <ExplosionEffect
        position={[4, 0, 0]}
        active={impacted}
        colors={["#FF4500", "#FF6347", "#FFD700", "#8B4513", "#A0522D"]}
        count={200}
        force={8}
      />

      <ShockwaveEffect
        position={[4, 0, 0.1]}
        active={impacted}
        color="#FF4500"
        maxScale={10}
        duration={1}
      />

      <ScreenShake intensity={0.25} active={impacted && impactT < 0.4} />
    </group>
  );
}
