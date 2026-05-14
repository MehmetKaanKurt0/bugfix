import * as THREE from "three";
import { lerp } from "./easing";

export function shakeCamera(
  camera: THREE.Camera,
  intensity: number,
  basePos: THREE.Vector3
) {
  camera.position.x = basePos.x + (Math.random() - 0.5) * intensity;
  camera.position.y = basePos.y + (Math.random() - 0.5) * intensity;
}

export function dollyCamera(
  camera: THREE.Camera,
  from: number,
  to: number,
  t: number
) {
  camera.position.z = lerp(from, to, t);
}

export function orbitCamera(
  camera: THREE.Camera,
  angle: number,
  radius: number,
  height: number
) {
  camera.position.x = Math.sin(angle) * radius;
  camera.position.z = Math.cos(angle) * radius;
  camera.position.y = height;
  camera.lookAt(0, 0, 0);
}
