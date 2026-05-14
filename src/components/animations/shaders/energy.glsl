// Energy charge/beam fragment shader
uniform float uTime;
uniform float uIntensity;
uniform vec3 uColor;
uniform float uChargeProgress;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec2 center = vec2(0.5);
  float dist = distance(uv, center);

  // Pulsing energy core
  float pulse = sin(uTime * 8.0 + dist * 20.0) * 0.5 + 0.5;
  float core = smoothstep(0.4, 0.0, dist) * uChargeProgress;

  // Rotating energy rings
  float angle = atan(uv.y - 0.5, uv.x - 0.5);
  float ring1 = smoothstep(0.02, 0.0, abs(dist - 0.3 - sin(angle * 3.0 + uTime * 4.0) * 0.05));
  float ring2 = smoothstep(0.02, 0.0, abs(dist - 0.2 - cos(angle * 5.0 - uTime * 6.0) * 0.03));

  float rings = (ring1 + ring2) * uChargeProgress * pulse;

  // Electric arcs
  float arc = sin(angle * 8.0 + uTime * 12.0) * sin(angle * 5.0 - uTime * 8.0);
  arc = smoothstep(0.7, 1.0, arc) * smoothstep(0.35, 0.25, dist) * uChargeProgress;

  float alpha = (core + rings * 0.6 + arc * 0.4) * uIntensity;
  vec3 color = uColor * (core * 1.5 + rings + arc) + vec3(1.0) * core * 0.3;

  gl_FragColor = vec4(color, alpha);
}
