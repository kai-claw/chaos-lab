import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, THEMES } from '../store/useStore';

/**
 * Trail Sparkles — comet-like particle effect at the trail head.
 * Tiny glowing particles emit from the leading edge and scatter
 * outward, creating a living, breathing quality to the visualization.
 * Uses a ring buffer for zero-allocation particle management.
 */

const MAX_PARTICLES = 150;
const SPAWN_PER_FRAME = 2;
const MAX_LIFETIME = 50; // frames
const DRIFT_DECAY = 0.96;

const SCALE_MAP: Record<string, number> = {
  lorenz: 0.1,
  rossler: 0.5,
  doublePendulum: 1.0,
};

export const TrailSparkles: React.FC = () => {
  const { isPlaying, currentSystem, colorTheme } = useStore();
  const theme = THEMES[colorTheme];
  const pointsRef = useRef<THREE.Points>(null);
  const nextIdxRef = useRef(0);

  // Pre-allocated particle state arrays
  const state = useMemo(() => ({
    positions: new Float32Array(MAX_PARTICLES * 3),
    velocities: new Float32Array(MAX_PARTICLES * 3),
    lifetimes: new Float32Array(MAX_PARTICLES),
    colors: new Float32Array(MAX_PARTICLES * 4), // RGBA
    sizes: new Float32Array(MAX_PARTICLES),
  }), []);

  // Create initial buffer attributes
  const positionAttr = useMemo(
    () => new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3),
    []
  );
  const colorAttr = useMemo(
    () => new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 4), 4),
    []
  );
  const sizeAttr = useMemo(
    () => new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES), 1),
    []
  );

  // Cache the base color from the theme
  const baseColor = useMemo(() => {
    const c = new THREE.Color(theme.accent);
    return { r: c.r, g: c.g, b: c.b };
  }, [theme.accent]);

  // Reset particles when system changes
  useEffect(() => {
    state.lifetimes.fill(0);
    nextIdxRef.current = 0;
  }, [currentSystem, state]);

  useFrame(() => {
    if (!isPlaying || !pointsRef.current) return;

    const system = (window as unknown as Record<string, unknown>).__chaosLabSystem as
      | { points: THREE.Vector3[] }
      | undefined;
    if (!system?.points || system.points.length < 3) return;

    const pts = system.points;
    const scale = SCALE_MAP[currentSystem] ?? 0.1;
    const head = pts[pts.length - 1];
    const prev = pts[pts.length - 3];

    // Velocity for directional emission
    const vx = (head.x - prev.x) * scale;
    const vy = (head.y - prev.y) * scale;
    const vz = (head.z - prev.z) * scale;
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
    const spread = Math.max(0.01, speed * 2.0);

    // Spawn new particles
    for (let s = 0; s < SPAWN_PER_FRAME; s++) {
      const i = nextIdxRef.current;
      const i3 = i * 3;

      state.positions[i3] = head.x * scale;
      state.positions[i3 + 1] = head.y * scale;
      state.positions[i3 + 2] = currentSystem === 'doublePendulum' ? 0 : head.z * scale;

      // Emit in a cone behind the velocity direction + random scatter
      state.velocities[i3] = (Math.random() - 0.5) * spread - vx * 0.3;
      state.velocities[i3 + 1] = (Math.random() - 0.5) * spread - vy * 0.3;
      state.velocities[i3 + 2] = currentSystem === 'doublePendulum'
        ? (Math.random() - 0.5) * 0.02
        : (Math.random() - 0.5) * spread - vz * 0.3;

      state.lifetimes[i] = MAX_LIFETIME;
      state.sizes[i] = (0.5 + Math.random() * 1.0) * scale * 0.5;

      nextIdxRef.current = (nextIdxRef.current + 1) % MAX_PARTICLES;
    }

    // Update all particles
    const pBuf = positionAttr.array as Float32Array;
    const cBuf = colorAttr.array as Float32Array;
    const sBuf = sizeAttr.array as Float32Array;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      if (state.lifetimes[i] <= 0) {
        // Dead particle — hide it far away
        pBuf[i3] = 0;
        pBuf[i3 + 1] = 0;
        pBuf[i3 + 2] = -1000;
        cBuf[i4 + 3] = 0;
        sBuf[i] = 0;
        continue;
      }

      state.lifetimes[i]--;

      // Physics: drift + decay
      state.positions[i3] += state.velocities[i3] * 0.016;
      state.positions[i3 + 1] += state.velocities[i3 + 1] * 0.016;
      state.positions[i3 + 2] += state.velocities[i3 + 2] * 0.016;

      state.velocities[i3] *= DRIFT_DECAY;
      state.velocities[i3 + 1] *= DRIFT_DECAY;
      state.velocities[i3 + 2] *= DRIFT_DECAY;

      // Compute alpha (quadratic fade-out)
      const lifeRatio = state.lifetimes[i] / MAX_LIFETIME;
      const alpha = lifeRatio * lifeRatio;

      // Twinkling: add a subtle flicker
      const flicker = 0.8 + Math.sin(state.lifetimes[i] * 0.5 + i * 0.7) * 0.2;

      // Copy to buffer
      pBuf[i3] = state.positions[i3];
      pBuf[i3 + 1] = state.positions[i3 + 1];
      pBuf[i3 + 2] = state.positions[i3 + 2];

      cBuf[i4] = baseColor.r * flicker;
      cBuf[i4 + 1] = baseColor.g * flicker;
      cBuf[i4 + 2] = baseColor.b * flicker;
      cBuf[i4 + 3] = alpha * flicker;

      sBuf[i] = state.sizes[i] * (0.3 + lifeRatio * 0.7);
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <primitive object={positionAttr} attach="attributes-position" />
        <primitive object={colorAttr} attach="attributes-color" />
        <primitive object={sizeAttr} attach="attributes-size" />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.04}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};
