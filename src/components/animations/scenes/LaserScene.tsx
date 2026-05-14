"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import ScreenShake from "../effects/ScreenShake";
import ParticleSystem from "../effects/ParticleSystem";
import { easeOutCubic } from "../utils/easing";

interface LaserSceneProps {
  attacker: { name: string; color: string };
  defender: { name: string; color: string };
  progress: number;
}

export default function LaserScene({ attacker, defender, progress }: LaserSceneProps) {
  const attackerRef = useRef<THREE.Mesh>(null);
  const defenderRef = useRef<THREE.Mesh>(null);
  const chargeRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const [fired, setFired] = useState(false);

  const chargePhase = progress < 0.3;
  const firePhase = progress >= 0.3 && progress < 0.5;
  const beamPhase = progress >= 0.5 && progress < 0.75;
  const fadePhase = progress >= 0.75;

  const chargeT = chargePhase ? progress / 0.3 : 1;
  const fireT = firePhase ? (progress - 0.3) / 0.2 : 0;
  const beamT = beamPhase ? (progress - 0.5) / 0.25 : 0;

  useFrame(({ camera }) => {
    camera.position.set(0, 0, 10);

    if (attackerRef.current) {
      attackerRef.current.position.set(-4, 0, 0);
      attackerRef.current.rotation.y += 0.01;
    }

    if (defenderRef.current) {
      if (beamPhase || fadePhase) {
        defenderRef.current.position.x = 4 + beamT * 1.5;
        defenderRef.current.rotation.z += 0.02;
      } else {
        defenderRef.current.position.set(4, 0, 0);
      }
      defenderRef.current.rotation.y += 0.01;
    }

    if (chargeRef.current) {
      if (chargePhase) {
        const pulse = 0.3 + Math.sin(progress * 30) * 0.1;
        const s = chargeT * pulse;
        chargeRef.current.scale.setScalar(s);
        chargeRef.current.position.set(-2.5, 0, 0);
      } else if (fadePhase) {
        chargeRef.current.scale.setScalar(Math.max((1 - (progress - 0.75) / 0.25) * 0.3, 0.001));
      } else {
        chargeRef.current.scale.setScalar(0.3);
        chargeRef.current.position.set(-2.5, 0, 0);
      }
    }

    if (beamRef.current) {
      if (firePhase) {
        const beamLength = easeOutCubic(fireT) * 7;
        beamRef.current.scale.set(1, beamLength, 1);
        beamRef.current.position.set(-2.5 + beamLength / 2, 0, 0);
        beamRef.current.visible = true;
        if (!fired) setFired(true);
      } else if (beamPhase) {
        const pulse = 0.08 + Math.sin(progress * 20) * 0.04;
        beamRef.current.scale.set(pulse / 0.12, 7, 1);
        beamRef.current.position.set(-2.5 + 3.5, 0, 0);
      } else if (fadePhase) {
        const fadeT = (progress - 0.75) / 0.25;
        beamRef.current.scale.set(Math.max((1 - fadeT) * 0.8, 0.001), 7, 1);
      } else {
        beamRef.current.visible = false;
      }
    }

    if (beamPhase) {
      camera.position.x = Math.sin(beamT * Math.PI * 0.5) * 1;
    }
  });

  return (
    <group>
      <ambientLight intensity={chargePhase ? 0.2 * (1 - chargeT * 0.8) : 0.04} />

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

      {/* Charge orb */}
      <mesh ref={chargeRef} position={[-2.5, 0, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={attacker.color}
          transparent
          opacity={0.6}
          toneMapped={false}
        />
        <pointLight color={attacker.color} intensity={chargeT * 5} distance={5} />
      </mesh>

      {/* Charge rings */}
      {chargePhase && (
        <group position={[-2.5, 0, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation-x={i * Math.PI / 3} rotation-y={progress * (3 + i) * 5}>
              <torusGeometry args={[0.5 + chargeT * 0.3, 0.02, 8, 32]} />
              <meshBasicMaterial color={attacker.color} toneMapped={false} wireframe />
            </mesh>
          ))}
        </group>
      )}

      {/* Beam */}
      <mesh ref={beamRef} visible={false} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.12, 0.12, 1, 8]} />
        <meshBasicMaterial color={attacker.color} toneMapped={false} />
      </mesh>

      {/* Beam glow */}
      {(firePhase || beamPhase) && (
        <pointLight
          color={attacker.color}
          intensity={8}
          distance={12}
          position={[0, 0, 1]}
        />
      )}

      {chargePhase && chargeT > 0.3 && (
        <ParticleSystem
          count={50}
          colors={[attacker.color, "#FFFFFF"]}
          velocity={2}
          gravity={0}
          lifetime={0.5}
          size={0.02}
          origin={[-2.5, 0, 0]}
          mode="implode"
        />
      )}

      {fired && (
        <ParticleSystem
          count={30}
          colors={[attacker.color, "#FFFFFF"]}
          velocity={3}
          gravity={-2}
          lifetime={0.6}
          size={0.02}
          origin={[4, 0, 0]}
        />
      )}

      <ScreenShake intensity={0.1} active={firePhase} />
    </group>
  );
}
