// Shockwave distortion fragment shader
uniform float uTime;
uniform float uIntensity;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uThickness;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float dist = distance(uv, uCenter);
  float ring = smoothstep(uRadius - uThickness, uRadius, dist)
             - smoothstep(uRadius, uRadius + uThickness, dist);

  vec2 dir = normalize(uv - uCenter);
  uv += dir * ring * uIntensity * 0.05;

  float alpha = ring * uIntensity;
  vec3 color = vec3(1.0, 0.9, 0.7) * alpha;

  gl_FragColor = vec4(color, alpha * 0.6);
}
