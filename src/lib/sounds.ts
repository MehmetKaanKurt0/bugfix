let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function playBoom() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);
  gain.gain.setValueAtTime(0.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);

  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  noise.buffer = buf;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.3, ctx.currentTime);
  nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  noise.connect(nGain).connect(ctx.destination);
  noise.start();
  noise.stop(ctx.currentTime + 0.3);
}

export function playCrackling() {
  const ctx = getCtx();
  for (let i = 0; i < 4; i++) {
    const t = ctx.currentTime + i * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(800 + Math.random() * 1200, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.06);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }
  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
  noise.buffer = buf;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.2, ctx.currentTime);
  nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  noise.connect(nGain).connect(ctx.destination);
  noise.start();
  noise.stop(ctx.currentTime + 0.35);
}

export function playPewPew() {
  const ctx = getCtx();
  for (let i = 0; i < 2; i++) {
    const t = ctx.currentTime + i * 0.15;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.12);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }
}

export function playMeteor() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.6);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.7);
  setTimeout(() => playBoom(), 500);
}

export function playPortal() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.4);
  osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.8);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.6);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.9);
}

export function playVS() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.setValueAtTime(330, ctx.currentTime + 0.1);
  osc.frequency.setValueAtTime(440, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.25);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}

export function playConfetti() {
  const ctx = getCtx();
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}
