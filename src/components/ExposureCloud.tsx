import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, THEMES } from '../store/useStore';
import { systemRef } from '../store/systemRef';

/**
 * Exposure Cloud — long-exposure point accumulation.
 *
 * Like a time-lapse photograph of chaos: every few frames, the trail
 * head's position is recorded as a persistent luminous point. Over time,
 * thousands of points accumulate, revealing the attractor's full density
 * structure — where the system spends more time glows brighter.
 *
 * The result is a beautiful point cloud that shows the attractor as a
 * glowing, ethereal sculpture. Unlike the particle swarm (which follows
 * active trajectories), this is a passive accumulation that reveals the
 * statistical nature of chaos.
 *
 * Points are stored in a ring buffer. Once full, the oldest points are
 * overwritten, creating a steady-state image of the attractor.
 */

const MAX_EXPOSURE_POINTS = 15000;
const DROP_INTERVAL = 2; // drop a point every N frames

const SCALE_MAP: Record<string, number> = {
  lorenz: 0.1,
  rossler: 0.5,
  doublePendulum: 1.0,
};

export const ExposureCloud: React.FC = () => {
  const {
    exposureMode, isPlaying, currentSystem, colorTheme, _exposureClearCounter,
  } = useStore();
  const theme = THEMES[colorTheme];
  const pointsRef = useRef<THREE.Points>(null);
  const nextIdx = useRef(0);
  const frameCount = useRef(0);
  const totalDropped = useRef(0);

  // Pre-allocated buffer attributes
  const positionAttr = useMemo(
    () => new THREE.BufferAttribute(new Float32Array(MAX_EXPOSURE_POINTS * 3), 3),
    [],
  );
  const colorAttr = useMemo(
    () => new THREE.BufferAttribute(new Float32Array(MAX_EXPOSURE_POINTS * 3), 3),
    [],
  );
  const sizeAttr = useMemo(
    () => new THREE.BufferAttribute(new Float32Array(MAX_EXPOSURE_POINTS), 1),
    [],
  );

  // Compute base colors from theme
  const baseHSL = useMemo(() => {
    return { h: theme.trailHue1, s: 0.7, l: 0.5 };
  }, [theme.trailHue1]);

  // Pre-allocated scratch color to avoid per-frame allocation
  const _scratchColor = useMemo(() => new THREE.Color(), []);

  // Reset on system change, mode toggle, or manual clear
  useEffect(() => {
    // Zero out all positions (move off-screen)
    const pBuf = positionAttr.array as Float32Array;
    const cBuf = colorAttr.array as Float32Array;
    const sBuf = sizeAttr.array as Float32Array;
    for (let i = 0; i < MAX_EXPOSURE_POINTS; i++) {
      const i3 = i * 3;
      pBuf[i3] = 0;
      pBuf[i3 + 1] = 0;
      pBuf[i3 + 2] = -1000;
      cBuf[i3] = 0;
      cBuf[i3 + 1] = 0;
      cBuf[i3 + 2] = 0;
      sBuf[i] = 0;
    }
    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    nextIdx.current = 0;
    totalDropped.current = 0;
    frameCount.current = 0;
  }, [currentSystem, exposureMode, _exposureClearCounter, positionAttr, colorAttr, sizeAttr]);

  useFrame(() => {
    if (!exposureMode || !isPlaying || !pointsRef.current) return;

    frameCount.current++;
    if (frameCount.current % DROP_INTERVAL !== 0) return;

    const system = systemRef.system;
    if (!system?.points || system.points.length < 2) return;

    const pts = system.points;
    const scale = SCALE_MAP[currentSystem] ?? 0.1;
    const head = pts[pts.length - 1];
    const flat = currentSystem === 'doublePendulum';

    // Calculate velocity for color variation
    const prev = pts[Math.max(0, pts.length - 3)];
    const vx = head.x - prev.x;
    const vy = head.y - prev.y;
    const vz = head.z - prev.z;
    const velocity = Math.sqrt(vx * vx + vy * vy + vz * vz);

    const i = nextIdx.current;
    const i3 = i * 3;

    const pBuf = positionAttr.array as Float32Array;
    const cBuf = colorAttr.array as Float32Array;
    const sBuf = sizeAttr.array as Float32Array;

    // Position
    pBuf[i3] = head.x * scale;
    pBuf[i3 + 1] = head.y * scale;
    pBuf[i3 + 2] = flat ? 0 : head.z * scale;

    // Color: hue shifts slightly with velocity, creating depth
    // Reuse pre-allocated Color to avoid per-frame GC pressure
    const velFactor = Math.min(velocity * 0.3, 0.15);
    const hue = (baseHSL.h + velFactor) % 1;
    _scratchColor.setHSL(hue, baseHSL.s, baseHSL.l);
    cBuf[i3] = _scratchColor.r;
    cBuf[i3 + 1] = _scratchColor.g;
    cBuf[i3 + 2] = _scratchColor.b;

    // Size: slightly random for organic feel
    sBuf[i] = 0.015 + Math.random() * 0.01;

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;

    nextIdx.current = (nextIdx.current + 1) % MAX_EXPOSURE_POINTS;
    totalDropped.current++;

    // Update draw range (grows until buffer is full, then stays full)
    const drawCount = Math.min(totalDropped.current, MAX_EXPOSURE_POINTS);
    if (pointsRef.current.geometry) {
      pointsRef.current.geometry.setDrawRange(0, drawCount);
    }
  });

  if (!exposureMode) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <primitive object={positionAttr} attach="attributes-position" />
        <primitive object={colorAttr} attach="attributes-color" />
        <primitive object={sizeAttr} attach="attributes-size" />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.02}
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};
