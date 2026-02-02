import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DoublePendulumSystem } from '../systems/doublePendulum';
import { useStore, THEMES } from '../store/useStore';
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

  // Expose system for Poincaré access
  useEffect(() => {
    if (!isSecondary) {
      (window as any).__chaosLabSystem = pendulumSystem;
      (window as any).__chaosLabSystemType = 'doublePendulum';
    }
    return () => {
      if (!isSecondary && (window as any).__chaosLabSystem === pendulumSystem) {
        (window as any).__chaosLabSystem = null;
      }
    };
  }, [pendulumSystem, isSecondary]);

  const frameCounter = useRef(0);

  useFrame(() => {
    if (!isPlaying) return;
    pendulumSystem.step(speed * 2.0);
    pendulumSystem.trimTrail(trailLength);

    const pts = pendulumSystem.points;
    if (lastPosRef && pts.length > 0) {
      const last = pts[pts.length - 1];
      (lastPosRef as React.MutableRefObject<THREE.Vector3 | null>).current = new THREE.Vector3(last.x, last.y, 0);
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
  const rodColor = new THREE.Color(theme.textMuted);
  const mass1Color = new THREE.Color().setHSL(hStart, 0.8, 0.6);
  const mass2Color = new THREE.Color().setHSL(hStart + 0.1, 0.8, 0.7);

  const rod1End = [currentPos.p1.x * scale, currentPos.p1.y * scale, 0] as const;
  const rod2End = [currentPos.p2.x * scale, currentPos.p2.y * scale, 0] as const;

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

      {/* Rod 1 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, ...rod1End]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={rodColor} linewidth={2} transparent opacity={0.6} />
      </line>

      {/* Rod 2 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([...rod1End, ...rod2End]), 3]}
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
      <mesh position={[rod1End[0], rod1End[1], rod1End[2]]}>
        <sphereGeometry args={[0.06 * Math.sqrt(doublePendulumParams.mass1), 16, 16]} />
        <meshBasicMaterial color={mass1Color} />
      </mesh>

      {/* Mass 2 — tip with glow (this is where the trail draws) */}
      <TrailHeadGlow
        position={[rod2End[0], rod2End[1], rod2End[2]]}
        color={mass2Color}
        lightIntensity={isSecondary ? 0.3 : 0.6}
        size={0.8 * Math.sqrt(doublePendulumParams.mass2)}
        showPulse={!isSecondary}
      />
    </group>
  );
};
