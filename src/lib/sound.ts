/**
 * Sound Manager for PokéTeam application
 * Handles procedural sound synthesis via Web Audio API with HTML5 Audio fallbacks
 * for coin/medal flip and stamp stamping effects.
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

// Load mute preference if available
if (typeof window !== "undefined") {
  const saved = localStorage.getItem("poketeam_sound_enabled");
  if (saved !== null) {
    soundEnabled = saved === "true";
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (typeof window !== "undefined") {
    localStorage.setItem("poketeam_sound_enabled", String(enabled));
  }
}

/**
 * Play coin/medal flip sound
 * Synthesizes a bright, metallic retro coin chime (B5 -> E6 harmonics)
 */
export function playCoinSound(): void {
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) {
    playFallbackAudio("/sounds/coin.wav");
    return;
  }

  try {
    const now = ctx.currentTime;

    // Tone 1: B5 (987.77 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(987.77, now);
    
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Tone 2: E6 (1318.51 Hz) + harmonic (2637 Hz)
    const osc2 = ctx.createOscillator();
    const osc2Harmonic = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1318.51, now + 0.06);

    osc2Harmonic.type = "triangle";
    osc2Harmonic.frequency.setValueAtTime(2637.02, now + 0.06);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.3, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc2.connect(gain2);
    osc2Harmonic.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.06);
    osc2Harmonic.start(now + 0.06);
    osc2.stop(now + 0.35);
    osc2Harmonic.stop(now + 0.35);

    // Initial metallic clink noise burst
    playMetallicClick(ctx, now);
  } catch (err) {
    console.warn("Web Audio coin error, playing fallback WAV", err);
    playFallbackAudio("/sounds/coin.wav");
  }
}

/**
 * Play stamp sound
 * Synthesizes a deep mechanical thud + paper impact slap
 */
export function playStampSound(): void {
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) {
    playFallbackAudio("/sounds/stamp.wav");
    return;
  }

  try {
    const now = ctx.currentTime;

    // Sub-thud: Pitch drop 180Hz -> 40Hz
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();

    thudOsc.type = "sine";
    thudOsc.frequency.setValueAtTime(180, now);
    thudOsc.frequency.exponentialRampToValueAtTime(38, now + 0.08);

    thudGain.gain.setValueAtTime(0.5, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);

    thudOsc.start(now);
    thudOsc.stop(now + 0.22);

    // Mid-knock body (90Hz)
    const knockOsc = ctx.createOscillator();
    const knockGain = ctx.createGain();

    knockOsc.type = "triangle";
    knockOsc.frequency.setValueAtTime(90, now);

    knockGain.gain.setValueAtTime(0.25, now);
    knockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    knockOsc.connect(knockGain);
    knockGain.connect(ctx.destination);

    knockOsc.start(now);
    knockOsc.stop(now + 0.1);

    // Paper slap burst (filtered noise)
    playPaperSlap(ctx, now);
  } catch (err) {
    console.warn("Web Audio stamp error, playing fallback WAV", err);
    playFallbackAudio("/sounds/stamp.wav");
  }
}

function playMetallicClick(ctx: AudioContext, startTime: number): void {
  const bufferSize = Math.floor(ctx.sampleRate * 0.02);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-150 * (i / ctx.sampleRate));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 3000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, startTime);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(startTime);
}

function playPaperSlap(ctx: AudioContext, startTime: number): void {
  const bufferSize = Math.floor(ctx.sampleRate * 0.04);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-70 * (i / ctx.sampleRate));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1200;
  filter.Q.value = 2;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.35, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(startTime);
}

function playFallbackAudio(url: string): void {
  try {
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    // Ignore autoplay restriction or missing file in non-browser context
  }
}
