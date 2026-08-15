export type SnowveilAudio = {
  unlock: () => Promise<boolean>;
  toggle: () => Promise<boolean>;
  cast: () => void;
  jump: () => void;
  land: () => void;
  activateBeacon: (index: number, final: boolean) => void;
  setMotion: (
    speed: number,
    grounded: boolean,
    skidAmount?: number,
    edgeAmount?: number,
    powderEnergy?: number,
  ) => void;
  dispose: () => void;
};

const MIN_GAIN = 0.0001;

function makeNoiseBuffer(context: AudioContext) {
  const frameCount = context.sampleRate * 2;
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 0x5f3759df;
  for (let index = 0; index < frameCount; index += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    data[index] = (seed / 0xffffffff) * 2 - 1;
  }
  return buffer;
}

function ramp(param: AudioParam, value: number, now: number, duration = 0.08) {
  param.cancelScheduledValues(now);
  param.setValueAtTime(Math.max(param.value, MIN_GAIN), now);
  param.exponentialRampToValueAtTime(Math.max(value, MIN_GAIN), now + duration);
}

export function createSnowveilAudio(): SnowveilAudio {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let windGain: GainNode | null = null;
  let rideGain: GainNode | null = null;
  let edgeGain: GainNode | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  let enabled = true;
  let disposed = false;
  const activeBeacons = new Set<number>();
  const droneNodes = new Map<number, { oscillator: OscillatorNode; gain: GainNode }>();

  const createLoop = (filterType: BiquadFilterType, frequency: number, gainValue: number) => {
    if (!context || !noiseBuffer || !master) return null;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = noiseBuffer;
    source.loop = true;
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = filterType === "bandpass" ? 0.54 : 0.22;
    gain.gain.value = gainValue;
    source.connect(filter).connect(gain).connect(master);
    source.start();
    return gain;
  };

  const startDrone = (index: number) => {
    if (!context || !master || droneNodes.has(index)) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = [91.7, 118.4, 147.2][index] ?? 110;
    oscillator.detune.value = index * 3 - 3;
    filter.type = "lowpass";
    filter.frequency.value = 620;
    gain.gain.setValueAtTime(MIN_GAIN, now);
    gain.gain.exponentialRampToValueAtTime(0.016, now + 1.7 + index * 0.24);
    oscillator.connect(filter).connect(gain).connect(master);
    oscillator.start();
    droneNodes.set(index, { oscillator, gain });
  };

  const initialize = () => {
    if (context || disposed || typeof window === "undefined") return;
    context = new AudioContext({ latencyHint: "interactive" });
    master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    master.gain.value = MIN_GAIN;
    compressor.threshold.value = -15;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.012;
    compressor.release.value = 0.31;
    master.connect(compressor).connect(context.destination);
    noiseBuffer = makeNoiseBuffer(context);
    windGain = createLoop("bandpass", 430, 0.036);
    rideGain = createLoop("highpass", 920, MIN_GAIN);
    edgeGain = createLoop("bandpass", 1680, MIN_GAIN);

    const rumble = context.createOscillator();
    const rumbleGain = context.createGain();
    rumble.type = "sine";
    rumble.frequency.value = 38;
    rumbleGain.gain.value = 0.008;
    rumble.connect(rumbleGain).connect(master);
    rumble.start();
    for (const index of activeBeacons) startDrone(index);
  };

  const playTone = (
    startFrequency: number,
    endFrequency: number,
    duration: number,
    level: number,
    type: OscillatorType = "sine",
    delay = 0,
  ) => {
    if (!context || !master || context.state !== "running") return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(endFrequency, 20), start + duration);
    gain.gain.setValueAtTime(MIN_GAIN, start);
    gain.gain.exponentialRampToValueAtTime(level, start + Math.min(0.035, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(MIN_GAIN, start + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  };

  return {
    async unlock() {
      initialize();
      if (!context || !master || disposed) return false;
      if (context.state !== "running") await context.resume();
      if (enabled) ramp(master.gain, 0.52, context.currentTime, 0.28);
      return enabled;
    },
    async toggle() {
      const wasInitialized = Boolean(context);
      initialize();
      if (!context || !master || disposed) return false;
      if (context.state !== "running") await context.resume();
      if (!wasInitialized) {
        enabled = true;
        ramp(master.gain, 0.52, context.currentTime, 0.28);
        return true;
      }
      enabled = !enabled;
      ramp(master.gain, enabled ? 0.52 : MIN_GAIN, context.currentTime, 0.18);
      return enabled;
    },
    cast() {
      if (!context || !master || context.state !== "running" || !enabled) return;
      const now = context.currentTime;
      playTone(680, 178, 0.32, 0.075, "triangle");
      if (noiseBuffer) {
        const burst = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        burst.buffer = noiseBuffer;
        filter.type = "bandpass";
        filter.frequency.value = 1850;
        filter.Q.value = 0.8;
        gain.gain.setValueAtTime(0.038, now);
        gain.gain.exponentialRampToValueAtTime(MIN_GAIN, now + 0.24);
        burst.connect(filter).connect(gain).connect(master);
        burst.start(now, 0.37, 0.25);
      }
    },
    jump() {
      if (!context || !master || context.state !== "running" || !enabled) return;
      playTone(118, 196, 0.18, 0.032, "triangle");
      playTone(246, 318, 0.13, 0.018, "sine", 0.025);
    },
    land() {
      if (!context || !master || context.state !== "running" || !enabled) return;
      playTone(92, 48, 0.2, 0.04, "sine");
      if (noiseBuffer) {
        const burst = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        const now = context.currentTime;
        burst.buffer = noiseBuffer;
        filter.type = "lowpass";
        filter.frequency.value = 680;
        gain.gain.setValueAtTime(0.028, now);
        gain.gain.exponentialRampToValueAtTime(MIN_GAIN, now + 0.16);
        burst.connect(filter).connect(gain).connect(master);
        burst.start(now, 0.82, 0.18);
      }
    },
    activateBeacon(index, final) {
      if (activeBeacons.has(index)) return;
      activeBeacons.add(index);
      if (!context || context.state !== "running" || !enabled) return;
      startDrone(index);
      const root = [238, 284, 337][index] ?? 260;
      playTone(root, root * 1.5, 0.72, 0.052, "sine");
      playTone(root * 2.02, root * 1.01, 0.9, 0.028, "triangle", 0.06);
      if (final) {
        playTone(174, 348, 2.4, 0.048, "sine", 0.24);
        playTone(261, 522, 2.7, 0.036, "sine", 0.36);
        playTone(397, 794, 3.1, 0.026, "sine", 0.48);
      }
    },
    setMotion(speed, grounded, skidAmount = 0, edgeAmount = 0, powderEnergy = 0) {
      if (
        !context || !rideGain || !edgeGain || !windGain ||
        context.state !== "running" || !enabled
      ) return;
      const now = context.currentTime;
      const normalized = Math.min(Math.max(speed / 8.4, 0), 1);
      const skid = Math.min(Math.max(skidAmount, 0), 1);
      const edge = Math.min(Math.max(edgeAmount, 0), 1);
      const powder = Math.min(Math.max(powderEnergy, 0), 1);
      const contact = grounded ? 1 : 0;
      rideGain.gain.setTargetAtTime(MIN_GAIN + normalized * normalized * 0.062 * contact, now, 0.055);
      const edgePressure = Math.max(skid, edge * 0.55);
      const scrapeEnergy = Math.max(normalized * edgePressure, powder * 0.82);
      edgeGain.gain.setTargetAtTime(
        MIN_GAIN + scrapeEnergy * scrapeEnergy * 0.085 * contact,
        now,
        0.035,
      );
      windGain.gain.setTargetAtTime(0.032 + normalized * 0.018, now, 0.3);
    },
    dispose() {
      disposed = true;
      for (const { oscillator } of droneNodes.values()) oscillator.stop();
      droneNodes.clear();
      void context?.close();
      context = null;
      master = null;
      windGain = null;
      rideGain = null;
      edgeGain = null;
      noiseBuffer = null;
    },
  };
}
