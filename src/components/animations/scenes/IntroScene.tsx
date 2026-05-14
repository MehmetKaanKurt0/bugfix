"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { easeOutElastic, easeOutCubic } from "../utils/easing";
import ParticleSystem from "../effects/ParticleSystem";

interface IntroSceneProps {
  roundTitle: string;
  progress: number; // 0 to 1
}

const _dummy = new THREE.Object3D();

function Starfield() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const stars = useMemo(() => {
    const count = typeof window !== "undefined" && window.innerWidth < 768 ? 250 : 500;
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 40,
      y: (Math.random() - 0.5) * 25,
      z: -5 - Math.random() * 20,
      speed: 0.5 + Math.random() * 2,
      size: 0.01 + Math.random() * 0.03,
    }));
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.z += s.speed * delta * 3;
      if (s.z > 5) s.z = -25;

      _dummy.position.set(s.x, s.y, s.z);
      _dummy.scale.setScalar(s.size);
      _dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, _dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, stars.length]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
    </instancedMesh>
  );
}

export default function IntroScene({ roundTitle, progress }: IntroSceneProps) {
  const titleRef = useRef<THREE.Group>(null);
  const subRef = useRef<THREE.Group>(null);

  const fadeIn = Math.min(progress / 0.15, 1);
  const titleScale = progress > 0.1 ? easeOutElastic(Math.min((progress - 0.1) / 0.3, 1)) : 0;
  const subOpacity = progress > 0.35 ? easeOutCubic(Math.min((progress - 0.35) / 0.2, 1)) : 0;
  const fadeOut = progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1;
  const dollyZ = 10 - progress * 3;
  const showParticles = progress > 0.15 && progress < 0.85;

  const subText = "Sıralama değişiyor...";
  const visibleChars = Math.floor(subOpacity * subText.length);
  const displaySub = subText.slice(0, visibleChars);

  useFrame(({ camera }) => {
    camera.position.z = dollyZ;

    if (titleRef.current) {
      titleRef.current.scale.setScalar(titleScale * fadeOut);
      titleRef.current.rotation.y = Math.sin(progress * Math.PI * 2) * 0.03;
    }
    if (subRef.current) {
      subRef.current.scale.setScalar(subOpacity * fadeOut);
    }
  });

  return (
    <group>
      <ambientLight intensity={0.1 * fadeIn * fadeOut} />

      <Starfield />

      <group ref={titleRef}>
        <Text
          fontSize={1.2}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          position={[0, 0.5, 0]}
          font="/fonts/Orbitron-Bold.ttf"
          outlineWidth={0.02}
          outlineColor="#7C3AED"
        >
          TUR SONUÇLARI
          <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
        </Text>
        <pointLight color="#7C3AED" intensity={4 * fadeOut} distance={10} position={[0, 0.5, 2]} />
      </group>

      <group ref={subRef} position={[0, -0.8, 0]}>
        <Text
          fontSize={0.35}
          color="#7C3AED"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Orbitron-Bold.ttf"
        >
          {displaySub}
          <meshBasicMaterial color="#7C3AED" toneMapped={false} opacity={0.6} transparent />
        </Text>
      </group>

      <group position={[0, -1.5, 0]}>
        <Text
          fontSize={0.25}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Orbitron-Bold.ttf"
        >
          {roundTitle}
          <meshBasicMaterial color="#FFFFFF" toneMapped={false} opacity={0.3 * fadeOut} transparent />
        </Text>
      </group>

      {showParticles && (
        <ParticleSystem
          count={200}
          colors={["#7C3AED", "#06B6D4", "#FFFFFF", "#4F46E5"]}
          velocity={2}
          gravity={-0.3}
          lifetime={2}
          size={0.03}
          origin={[0, 0, 0]}
        />
      )}
    </group>
  );
}
