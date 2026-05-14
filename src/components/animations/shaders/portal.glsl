// Portal vortex fragment shader
uniform float uTime;
uniform float uIntensity;
uniform vec3 uColor;
uniform float uOpenProgress;

varying vec2 vUv;

void main() {
  vec2 uv = vUv - 0.5;
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);

  // Spiral distortion
  float spiral = sin(angle * 6.0 - uTime * 3.0 + dist * 15.0) * 0.5 + 0.5;
  float spiral2 = sin(angle * 4.0 + uTime * 5.0 - dist * 10.0) * 0.5 + 0.5;

  // Portal ring
  float portalRadius = 0.35 * uOpenProgress;
  float ring = smoothstep(portalRadius + 0.06, portalRadius, dist)
             - smoothstep(portalRadius, portalRadius - 0.06, dist);

  // Inner vortex
  float inner = smoothstep(portalRadius - 0.02, 0.0, dist) * uOpenProgress;
  float vortex = inner * (spiral * 0.6 + spiral2 * 0.4);

  // Edge glow
  float glow = smoothstep(portalRadius + 0.15, portalRadius, dist) * 0.3 * uOpenProgress;

  // Particle sparkles on ring
  float sparkle = sin(angle * 12.0 + uTime * 8.0) * sin(angle * 7.0 - uTime * 6.0);
  sparkle = smoothstep(0.8, 1.0, sparkle) * ring;

  float alpha = (ring * 0.8 + vortex * 0.5 + glow + sparkle * 0.6) * uIntensity;
  vec3 color = uColor * (ring + glow) + vec3(0.6, 0.8, 1.0) * vortex + vec3(1.0) * sparkle * 0.5;

  gl_FragColor = vec4(color, alpha);
}
