import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, THEMES } from '../store/useStore';

/**
 * Particle Swarm — a murmuration of particles tracing the attractor.
 *
 * Instead of a single trail, 200 particles simultaneously evolve through
 * the chaos equations, each starting from slightly different initial conditions.
 * The swarm reveals the attractor's shape as an emergent collective pattern —
 * like a flock of starlings dancing through phase space.
 *
 * Uses Euler integration (sufficient for visual particles) and THREE.Points
 * with per-vertex color for GPU-efficient rendering.
 */

const PARTICLE_COUNT = 200;

const SCALE_MAP: Record<string, number> = {
  lorenz: 0.1,
  rossler: 0.5,
  doublePendulum: 1.0,
};

export const ParticleSwarm: React.FC = () => {
  const {
    particleSwarm, isPlaying, speed, currentSystem, colorTheme,
    lorenzParams, rosslerParams, doublePendulumParams, _resetCounter,
  } = useStore();
  const theme = THEMES[colorTheme];
  const pointsRef = useRef<THREE.Points>(null);

  // Particle system state: flat typed arrays for zero-alloc per-frame update
  // For 3D systems: systemState stores [x, y, z, unused] per particle
  // For pendulum: systemState stores [theta1, theta2, omega1, omega2] per particle
  const state = useMemo(() => ({
    systemState: new Float32Array(PARTICLE_COUNT * 4),
    prevX: new Float32Array(PARTICLE_COUNT), // for velocity color
    prevY: new Float32Array(PARTICLE_COUNT),
    prevZ: new Float32Array(PARTICLE_COUNT),
    sizes: new Float32Array(PARTICLE_COUNT),
    initialized: false,
  }), []);

  // Buffer attributes (pre-allocated, updated in-place each frame)
  const positionAttr = useMemo(
    () => new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3),
    []
  );
  const colorAttr = useMemo(
    () => new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3),
    []
  );
  const sizeAttr = useMemo(
    () => new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT), 1),
    []
  );

  // Theme base color
  const baseColor = useMemo(() => {
    const c = new THREE.Color(theme.accent);
    return { r: c.r, g: c.g, b: c.b };
  }, [theme.accent]);

  const accent2Color = useMemo(() => {
    const c = new THREE.Color(theme.accent2);
    return { r: c.r, g: c.g, b: c.b };
  }, [theme.accent2]);

  // Initialize / reinitialize particles
  const initParticles = () => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i4 = i * 4;
      if (currentSystem === 'doublePendulum') {
        // Spread around the default initial angles
        state.systemState[i4]     = Math.PI / 2 + (Math.random() - 0.5) * 0.5;   // theta1
        state.systemState[i4 + 1] = Math.PI / 2 + (Math.random() - 0.5) * 0.5;   // theta2
        state.systemState[i4 + 2] = (Math.random() - 0.5) * 1.0;                   // omega1
        state.systemState[i4 + 3] = (Math.random() - 0.5) * 1.0;                   // omega2
      } else if (currentSystem === 'lorenz') {
        // Cluster near the classic starting point with spread
        state.systemState[i4]     = 1 + (Math.random() - 0.5) * 4;
        state.systemState[i4 + 1] = 1 + (Math.random() - 0.5) * 4;
        state.systemState[i4 + 2] = 1 + (Math.random() - 0.5) * 4;
      } else {
        // Rössler
        state.systemState[i4]     = 1 + (Math.random() - 0.5) * 3;
        state.systemState[i4 + 1] = 1 + (Math.random() - 0.5) * 3;
        state.systemState[i4 + 2] = 0.5 + Math.random() * 2;
      }
      state.prevX[i] = state.systemState[i4];
      state.prevY[i] = state.systemState[i4 + 1];
      state.prevZ[i] = state.systemState[i4 + 2];
      state.sizes[i] = 0.025 + Math.random() * 0.025;
    }
    state.initialized = true;
  };

  // Re-init when system changes or swarm is toggled on
  useEffect(() => {
    if (particleSwarm) {
      initParticles();
    } else {
      state.initialized = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [particleSwarm, currentSystem, _resetCounter]);

  useFrame(() => {
    if (!particleSwarm || !isPlaying || !pointsRef.current || !state.initialized) return;

    const scale = SCALE_MAP[currentSystem] ?? 0.1;
    const dt = 0.01 * speed * 0.5;
    const pBuf = positionAttr.array as Float32Array;
    const cBuf = colorAttr.array as Float32Array;
    const sBuf = sizeAttr.array as Float32Array;

    if (currentSystem === 'lorenz') {
      const { sigma, rho, beta } = lorenzParams;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i4 = i * 4;
        const i3 = i * 3;
        let x = state.systemState[i4];
        let y = state.systemState[i4 + 1];
        let z = state.systemState[i4 + 2];

        // Euler step (fast, sufficient for visual particles)
        const dx = sigma * (y - x);
        const dy = x * (rho - z) - y;
        const dz = x * y - beta * z;
        x += dx * dt;
        y += dy * dt;
        z += dz * dt;

        // Stability guard
        if (!isFinite(x) || !isFinite(y) || !isFinite(z) || Math.abs(x) > 1e6) {
          x = 1 + (Math.random() - 0.5) * 4;
          y = 1 + (Math.random() - 0.5) * 4;
          z = 1 + (Math.random() - 0.5) * 4;
        }

        state.systemState[i4] = x;
        state.systemState[i4 + 1] = y;
        state.systemState[i4 + 2] = z;

        // World position
        pBuf[i3]     = x * scale;
        pBuf[i3 + 1] = y * scale;
        pBuf[i3 + 2] = z * scale;

        // Color by velocity (lerp from accent to accent2 based on speed)
        const vx = x - state.prevX[i];
        const vy = y - state.prevY[i];
        const vz = z - state.prevZ[i];
        const vel = Math.sqrt(vx * vx + vy * vy + vz * vz);
        const t = Math.min(1, vel * 0.15);
        cBuf[i3]     = baseColor.r * (1 - t) + accent2Color.r * t;
        cBuf[i3 + 1] = baseColor.g * (1 - t) + accent2Color.g * t;
        cBuf[i3 + 2] = baseColor.b * (1 - t) + accent2Color.b * t;

        sBuf[i] = state.sizes[i] * (0.6 + t * 0.4);

        state.prevX[i] = x;
        state.prevY[i] = y;
        state.prevZ[i] = z;
      }
    } else if (currentSystem === 'rossler') {
      const { a, b, c } = rosslerParams;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i4 = i * 4;
        const i3 = i * 3;
        let x = state.systemState[i4];
        let y = state.systemState[i4 + 1];
        let z = state.systemState[i4 + 2];

        const dx = -y - z;
        const dy = x + a * y;
        const dz = b + z * (x - c);
        x += dx * dt;
        y += dy * dt;
        z += dz * dt;

        if (!isFinite(x) || !isFinite(y) || !isFinite(z) || Math.abs(x) > 1e6) {
          x = 1 + (Math.random() - 0.5) * 3;
          y = 1 + (Math.random() - 0.5) * 3;
          z = 0.5 + Math.random() * 2;
        }

        state.systemState[i4] = x;
        state.systemState[i4 + 1] = y;
        state.systemState[i4 + 2] = z;

        pBuf[i3]     = x * scale;
        pBuf[i3 + 1] = y * scale;
        pBuf[i3 + 2] = z * scale;

        const vx = x - state.prevX[i];
        const vy = y - state.prevY[i];
        const vz = z - state.prevZ[i];
        const vel = Math.sqrt(vx * vx + vy * vy + vz * vz);
        const t = Math.min(1, vel * 0.1);
        cBuf[i3]     = baseColor.r * (1 - t) + accent2Color.r * t;
        cBuf[i3 + 1] = baseColor.g * (1 - t) + accent2Color.g * t;
        cBuf[i3 + 2] = baseColor.b * (1 - t) + accent2Color.b * t;

        sBuf[i] = state.sizes[i] * (0.6 + t * 0.4);

        state.prevX[i] = x;
        state.prevY[i] = y;
        state.prevZ[i] = z;
      }
    } else {
      // Double Pendulum — each particle evolves its own (theta1, theta2, omega1, omega2)
      const { mass1, mass2, length1, length2, gravity, damping } = doublePendulumParams;
      const m1 = mass1, m2 = mass2, l1 = length1, l2 = length2, g = gravity;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i4 = i * 4;
        const i3 = i * 3;
        let theta1 = state.systemState[i4];
        let theta2 = state.systemState[i4 + 1];
        let omega1 = state.systemState[i4 + 2];
        let omega2 = state.systemState[i4 + 3];

        // Compute accelerations (Euler for visual particles)
        const cos12 = Math.cos(theta1 - theta2);
        const sin12 = Math.sin(theta1 - theta2);
        const sin1 = Math.sin(theta1);
        const sin2 = Math.sin(theta2);

        const den1 = (m1 + m2) * l1 - m2 * l1 * cos12 * cos12;
        const den2 = (l2 / l1) * den1;

        const num1 = -m2 * l1 * omega1 * omega1 * sin12 * cos12 +
                      m2 * g * sin2 * cos12 +
                      m2 * l2 * omega2 * omega2 * sin12 -
                      (m1 + m2) * g * sin1;
        const num2 = -m2 * l2 * omega2 * omega2 * sin12 * cos12 +
                      (m1 + m2) * g * sin1 * cos12 +
                      (m1 + m2) * l1 * omega1 * omega1 * sin12 -
                      (m1 + m2) * g * sin2;

        let alpha1 = den1 !== 0 ? num1 / den1 : 0;
        let alpha2 = den2 !== 0 ? num2 / den2 : 0;
        alpha1 -= damping * omega1;
        alpha2 -= damping * omega2;

        theta1 += omega1 * dt;
        theta2 += omega2 * dt;
        omega1 += alpha1 * dt;
        omega2 += alpha2 * dt;

        // Stability guard
        if (!isFinite(theta1) || !isFinite(omega1) || Math.abs(omega1) > 1e6) {
          theta1 = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
          theta2 = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
          omega1 = 0;
          omega2 = 0;
        }

        state.systemState[i4] = theta1;
        state.systemState[i4 + 1] = theta2;
        state.systemState[i4 + 2] = omega1;
        state.systemState[i4 + 3] = omega2;

        // Convert to tip position (p2)
        const x = l1 * Math.sin(theta1) + l2 * Math.sin(theta2);
        const y = -l1 * Math.cos(theta1) - l2 * Math.cos(theta2);

        pBuf[i3]     = x * scale;
        pBuf[i3 + 1] = y * scale;
        pBuf[i3 + 2] = 0;

        // Color by angular velocity magnitude
        const angVel = Math.sqrt(omega1 * omega1 + omega2 * omega2);
        const t = Math.min(1, angVel * 0.15);
        cBuf[i3]     = baseColor.r * (1 - t) + accent2Color.r * t;
        cBuf[i3 + 1] = baseColor.g * (1 - t) + accent2Color.g * t;
        cBuf[i3 + 2] = baseColor.b * (1 - t) + accent2Color.b * t;

        sBuf[i] = state.sizes[i] * (0.6 + t * 0.4);

        state.prevX[i] = x;
        state.prevY[i] = y;
        state.prevZ[i] = 0;
      }
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  if (!particleSwarm) return null;

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
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};
