import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DoublePendulumSystem } from '../systems/doublePendulum';
import { useStore, THEMES } from '../store/useStore';
import { setActiveSystem, clearActiveSystem } from '../store/systemRef';
import { GradientTrail } from './GradientTrail';
import { TrailHeadGlow } from './TrailHeadGlow';

interface DoublePendulumProps {
  position?: [number, number, number];
  scale?: number;
  initialCondition?: { theta1: number; theta2: number; omega1: number; omega2: number };
  colorHue?: number;
  isSecondary?: boolean;
  lastPosRef?: React.RefObject<THREE.Vector3 | null>;
}

export const DoublePendulum: React.FC<DoublePendulumProps> = ({
  position = [0, 0, 0],
  scale = 1.0,
  initialCondition = { theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0 },
  isSecondary = false,
  lastPosRef,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const {
    isPlaying, speed, trailLength, doublePendulumParams, _resetCounter, colorTheme,
    showLyapunov, setLyapunovExponent, showPoincare, currentSystem,
  } = useStore();
  const theme = THEMES[colorTheme];

  const pendulumSystem = useMemo(() => {
    return new DoublePendulumSystem(initialCondition, doublePendulumParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialCondition.theta1, initialCondition.theta2,
    initialCondition.omega1, initialCondition.omega2,
    doublePendulumParams.mass1, doublePendulumParams.mass2,
    doublePendulumParams.length1, doublePendulumParams.length2,
    doublePendulumParams.gravity, doublePendulumParams.damping,
  ]);

  useEffect(() => {
    pendulumSystem.reset(initialCondition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_resetCounter]);

  useEffect(() => {
    pendulumSystem.updateParams(doublePendulumParams);
  }, [doublePendulumParams, pendulumSystem]);

  // Register as the active system (only primary, for per-frame readers)
  useEffect(() => {
    if (!isSecondary) {
      setActiveSystem(pendulumSystem, 'doublePendulum');
    }
    return () => {
      if (!isSecondary) {
        clearActiveSystem(pendulumSystem);
      }
    };
  }, [pendulumSystem, isSecondary]);

  const frameCounter = useRef(0);

  useFrame(() => {
    if (!isPlaying) return;
    pendulumSystem.step(speed * 2.0);
    pendulumSystem.trimTrail(trailLength);

    // Update divergence tracking ref (reuse vector — avoid per-frame alloc)
    const pts = pendulumSystem.points;
    if (lastPosRef && pts.length > 0) {
      const last = pts[pts.length - 1];
      const ref = lastPosRef as React.MutableRefObject<THREE.Vector3 | null>;
      if (ref.current) {
        ref.current.set(last.x, last.y, 0);
      } else {
        ref.current = new THREE.Vector3(last.x, last.y, 0);
      }
    }

    // Update Lyapunov (throttled)
    if (!isSecondary && currentSystem === 'doublePendulum' && (showLyapunov || showPoincare)) {
      frameCounter.current++;
      if (frameCounter.current % 30 === 0) {
        setLyapunovExponent(pendulumSystem.lyapunovExponent);
      }
    }
  });

  const currentPos = pendulumSystem.positions.length > 0
    ? pendulumSystem.getCurrentPositions()
    : { p1: { x: 0, y: 0 }, p2: { x: 0, y: 0 } };

  const hStart = isSecondary ? theme.trailHue2 : theme.trailHue1;
  const hEnd = hStart + 0.2;

  // Pre-allocated colors — only recompute when theme/hue changes
  const rodColor = useMemo(() => new THREE.Color(theme.textMuted), [theme.textMuted]);
  const mass1Color = useMemo(() => new THREE.Color().setHSL(hStart, 0.8, 0.6), [hStart]);
  const mass2Color = useMemo(() => new THREE.Color().setHSL(hStart + 0.1, 0.8, 0.7), [hStart]);

  // Pre-allocated Float32Arrays for rod geometry — updated in place
  const rod1Buf = useMemo(() => new Float32Array(6), []);  // pivot → p1
  const rod2Buf = useMemo(() => new Float32Array(6), []);  // p1 → p2

  const rod1Ref = useRef<THREE.BufferAttribute>(null);
  const rod2Ref = useRef<THREE.BufferAttribute>(null);
  const mass1Ref = useRef<THREE.Mesh>(null);
  const mass2Pos = useRef<[number, number, number]>([0, 0, 0]);

  // Update rod positions imperatively via refs (avoids per-frame Float32Array alloc)
  const updateRods = useCallback(() => {
    const p1x = currentPos.p1.x * scale;
    const p1y = currentPos.p1.y * scale;
    const p2x = currentPos.p2.x * scale;
    const p2y = currentPos.p2.y * scale;

    // rod1: [0,0,0] → [p1x, p1y, 0]
    rod1Buf[3] = p1x; rod1Buf[4] = p1y;
    if (rod1Ref.current) { rod1Ref.current.needsUpdate = true; }

    // rod2: [p1x, p1y, 0] → [p2x, p2y, 0]
    rod2Buf[0] = p1x; rod2Buf[1] = p1y;
    rod2Buf[3] = p2x; rod2Buf[4] = p2y;
    if (rod2Ref.current) { rod2Ref.current.needsUpdate = true; }

    // mass1 position
    if (mass1Ref.current) {
      mass1Ref.current.position.set(p1x, p1y, 0);
    }

    mass2Pos.current = [p2x, p2y, 0];
  }, [currentPos, scale, rod1Buf, rod2Buf]);

  updateRods();

  return (
    <group ref={groupRef} position={position}>
      <GradientTrail
        points={pendulumSystem.points}
        hueStart={hStart}
        hueEnd={hEnd}
        lineWidth={1.8}
        glowIntensity={0.4}
        scale={scale}
        flatZ
      />

      {/* Rod 1 — uses pre-allocated buffer, updated in place */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            ref={rod1Ref}
            attach="attributes-position"
            args={[rod1Buf, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={rodColor} linewidth={2} transparent opacity={0.6} />
      </line>

      {/* Rod 2 — uses pre-allocated buffer, updated in place */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            ref={rod2Ref}
            attach="attributes-position"
            args={[rod2Buf, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={rodColor} linewidth={2} transparent opacity={0.6} />
      </line>

      {/* Pivot */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>

      {/* Mass 1 — inner bob */}
      <mesh ref={mass1Ref}>
        <sphereGeometry args={[0.06 * Math.sqrt(doublePendulumParams.mass1), 16, 16]} />
        <meshBasicMaterial color={mass1Color} />
      </mesh>

      {/* Mass 2 — tip with glow (this is where the trail draws) */}
      <TrailHeadGlow
        position={mass2Pos.current}
        color={mass2Color}
        lightIntensity={isSecondary ? 0.3 : 0.6}
        size={0.8 * Math.sqrt(doublePendulumParams.mass2)}
        showPulse={!isSecondary}
      />
    </group>
  );
};
