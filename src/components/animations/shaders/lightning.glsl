// Lightning electric field fragment shader
uniform float uTime;
uniform float uIntensity;
uniform vec2 uStrikePoint;
uniform float uStrikeProgress;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 uv = vUv;
  float dist = distance(uv, uStrikePoint);

  // Electric field distortion
  float field = noise(uv * 8.0 + uTime * 3.0) * noise(uv * 12.0 - uTime * 5.0);
  field = smoothstep(0.3, 0.7, field);

  // Radial pulse from strike point
  float pulse = sin(dist * 30.0 - uTime * 15.0) * 0.5 + 0.5;
  pulse *= smoothstep(0.8, 0.0, dist) * uStrikeProgress;

  // Branching pattern
  float branch = noise(vec2(atan(uv.y - uStrikePoint.y, uv.x - uStrikePoint.x) * 3.0, uTime * 4.0));
  branch = smoothstep(0.6, 0.9, branch) * smoothstep(0.5, 0.1, dist) * uStrikeProgress;

  // Flash at strike point
  float flash = smoothstep(0.15, 0.0, dist) * uStrikeProgress * (0.5 + 0.5 * sin(uTime * 20.0));

  float alpha = (field * 0.15 + pulse * 0.4 + branch * 0.5 + flash) * uIntensity;
  vec3 color = vec3(0.3, 0.7, 1.0) * (pulse + branch) + vec3(1.0) * flash;

  gl_FragColor = vec4(color, alpha);
}
