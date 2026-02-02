import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { systemRef } from '../store/systemRef';

/**
 * Chaos Sonification — hear the mathematics of chaos.
 *
 * Maps the attractor's state to audio parameters:
 * - x position  → base frequency (pitch)
 * - y position  → second oscillator frequency (harmony)
 * - z position  → filter cutoff (brightness/darkness)
 * - velocity    → gain (louder when moving fast)
 *
 * Uses two detuned oscillators + filter for a rich, eerie sound
 * that directly reflects the system's behavior. The Lorenz
 * attractor creates swooping, whale-like sounds. Rössler produces
 * rhythmic, pulsing tones. The pendulum creates erratic percussive
 * patterns.
 */

const SCALE_MAP: Record<string, { xRange: [number, number]; yRange: [number, number]; zRange: [number, number] }> = {
  lorenz: {
    xRange: [-25, 25],
    yRange: [-30, 30],
    zRange: [0, 55],
  },
  rossler: {
    xRange: [-15, 15],
    yRange: [-15, 15],
    zRange: [0, 30],
  },
  doublePendulum: {
    xRange: [-3, 3],
    yRange: [-3, 3],
    zRange: [-1, 1],
  },
};

/** Map a value from one range to another */
function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const clamped = Math.max(inMin, Math.min(inMax, value));
  return outMin + ((clamped - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/** Pentatonic scale frequencies — always sounds musical */
const PENTATONIC_BASE = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.26];

function quantizeToPentatonic(freq: number): number {
  let closest = PENTATONIC_BASE[0];
  let minDist = Math.abs(freq - closest);
  for (let i = 1; i < PENTATONIC_BASE.length; i++) {
    const dist = Math.abs(freq - PENTATONIC_BASE[i]);
    if (dist < minDist) {
      minDist = dist;
      closest = PENTATONIC_BASE[i];
    }
  }
  return closest;
}

export const ChaosSynth: React.FC = () => {
  const { audioEnabled, audioVolume, currentSystem, isPlaying } = useStore();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const reverbGainRef = useRef<GainNode | null>(null);
  const prevPosRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const animFrameRef = useRef<number>(0);

  /** Create the audio graph */
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Oscillator 1: sine — warm base tone
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 220;
    osc1Ref.current = osc1;

    // Oscillator 2: triangle — slightly detuned for richness
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 220;
    osc2.detune.value = 7; // slight detune for chorus effect
    osc2Ref.current = osc2;

    // Filter: lowpass to shape brightness
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 2;
    filterRef.current = filter;

    // Gain: controlled by velocity
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gainRef.current = gain;

    // Master volume
    const masterGain = ctx.createGain();
    masterGain.gain.value = audioVolume;
    masterGainRef.current = masterGain;

    // Simple reverb using delay feedback
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.3;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.25;
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.3;
    reverbGainRef.current = reverbGain;

    // Connect: osc1 + osc2 → filter → gain → [masterGain → dest]
    //                                      → [delay → feedback → delay (loop)]
    //                                      → [delay → reverbGain → masterGain]
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    gain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(reverbGain);
    reverbGain.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start();
    osc2.start();
  }, [audioVolume]);

  /** Destroy the audio graph */
  const destroyAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (osc1Ref.current) {
      try { osc1Ref.current.stop(); } catch { /* already stopped */ }
      osc1Ref.current = null;
    }
    if (osc2Ref.current) {
      try { osc2Ref.current.stop(); } catch { /* already stopped */ }
      osc2Ref.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    gainRef.current = null;
    filterRef.current = null;
    masterGainRef.current = null;
    reverbGainRef.current = null;
    prevPosRef.current = null;
  }, []);

  /** Main audio update loop */
  const updateAudio = useCallback(() => {
    const ctx = audioCtxRef.current;
    const osc1 = osc1Ref.current;
    const osc2 = osc2Ref.current;
    const gain = gainRef.current;
    const filter = filterRef.current;

    if (!ctx || !osc1 || !osc2 || !gain || !filter) return;

    const activeSystem = systemRef.system;

    if (!activeSystem?.points || activeSystem.points.length < 5) {
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
      animFrameRef.current = requestAnimationFrame(updateAudio);
      return;
    }

    const systemType = systemRef.type || 'lorenz';
    const pts = activeSystem.points;
    const head = pts[pts.length - 1];
    const ranges = SCALE_MAP[systemType] || SCALE_MAP.lorenz;

    // Calculate velocity
    const prev = prevPosRef.current || head;
    const vx = head.x - prev.x;
    const vy = head.y - prev.y;
    const vz = head.z - prev.z;
    const velocity = Math.sqrt(vx * vx + vy * vy + vz * vz);
    prevPosRef.current = { x: head.x, y: head.y, z: head.z };

    const now = ctx.currentTime;
    const smoothTime = 0.08; // 80ms smoothing for musical transitions

    // Map x → frequency (quantized to pentatonic for musicality)
    const rawFreq = mapRange(head.x, ranges.xRange[0], ranges.xRange[1], 100, 600);
    const freq1 = quantizeToPentatonic(rawFreq);
    osc1.frequency.setTargetAtTime(freq1, now, smoothTime);

    // Map y → second oscillator (perfect fifth above for harmony)
    const rawFreq2 = mapRange(head.y, ranges.yRange[0], ranges.yRange[1], 80, 500);
    const freq2 = quantizeToPentatonic(rawFreq2) * 1.5; // perfect fifth
    osc2.frequency.setTargetAtTime(freq2, now, smoothTime * 1.5);

    // Map z → filter cutoff (higher z = brighter sound)
    const cutoff = mapRange(head.z, ranges.zRange[0], ranges.zRange[1], 200, 2500);
    filter.frequency.setTargetAtTime(cutoff, now, smoothTime);

    // Map velocity → gain (faster = louder, but with a musical curve)
    const maxVel = systemType === 'doublePendulum' ? 2 : 15;
    const velNorm = Math.min(1, velocity / maxVel);
    const targetGain = velNorm * velNorm * 0.4; // quadratic for more dynamic range
    gain.gain.setTargetAtTime(targetGain, now, smoothTime);

    animFrameRef.current = requestAnimationFrame(updateAudio);
  }, []);

  // Handle audio enable/disable
  useEffect(() => {
    if (audioEnabled && isPlaying) {
      initAudio();
      // Small delay to let audio context initialize
      setTimeout(() => {
        animFrameRef.current = requestAnimationFrame(updateAudio);
      }, 100);
    } else {
      destroyAudio();
    }

    return () => {
      destroyAudio();
    };
  }, [audioEnabled, isPlaying, initAudio, destroyAudio, updateAudio]);

  // Update master volume
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        audioVolume,
        audioCtxRef.current.currentTime,
        0.05
      );
    }
  }, [audioVolume]);

  // Mute when paused
  useEffect(() => {
    if (!audioEnabled) return;
    if (gainRef.current && audioCtxRef.current) {
      if (!isPlaying) {
        gainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.2);
      }
    }
  }, [isPlaying, audioEnabled]);

  // Cleanup on system change
  useEffect(() => {
    prevPosRef.current = null;
  }, [currentSystem]);

  return null;
};
