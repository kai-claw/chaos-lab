import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LorenzSystem } from '../systems/lorenz';
import { useStore, THEMES } from '../store/useStore';
import { GradientTrail } from './GradientTrail';

interface LorenzAttractorProps {
  position?: [number, number, number];
  scale?: number;
  initialCondition?: [number, number, number];
  colorHue?: number;
  isSecondary?: boolean;
  lastPosRef?: React.RefObject<THREE.Vector3 | null>;
}

export const LorenzAttractor: React.FC<LorenzAttractorProps> = ({
  position = [0, 0, 0],
  scale = 0.1,
  initialCondition = [1, 1, 1],
  isSecondary = false,
  lastPosRef,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const {
    isPlaying, speed, trailLength, lorenzParams, _resetCounter, colorTheme,
    showLyapunov, setLyapunovExponent, showPoincare,
  } = useStore();
  const theme = THEMES[colorTheme];

  const lorenzSystem = useMemo(() => {
    const initialPos = new THREE.Vector3(...initialCondition);
    return new LorenzSystem(initialPos, lorenzParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCondition[0], initialCondition[1], initialCondition[2], lorenzParams.sigma, lorenzParams.rho, lorenzParams.beta]);

  useEffect(() => {
    lorenzSystem.reset(new THREE.Vector3(...initialCondition));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_resetCounter]);

  useEffect(() => {
    lorenzSystem.updateParams(lorenzParams);
  }, [lorenzParams, lorenzSystem]);

  // Expose system ref for Poincaré and analysis
  const systemRef = useRef(lorenzSystem);
  systemRef.current = lorenzSystem;

  // Store system on window for Poincaré access (only primary)
  useEffect(() => {
    if (!isSecondary) {
      (window as any).__chaosLabSystem = lorenzSystem;
      (window as any).__chaosLabSystemType = 'lorenz';
    }
    return () => {
      if (!isSecondary && (window as any).__chaosLabSystem === lorenzSystem) {
        (window as any).__chaosLabSystem = null;
      }
    };
  }, [lorenzSystem, isSecondary]);

  const frameCounter = useRef(0);

  useFrame(() => {
    if (!isPlaying) return;
    lorenzSystem.step(speed * 0.5);
    lorenzSystem.trimTrail(trailLength);

    // Update divergence tracking ref
    const pts = lorenzSystem.points;
    if (lastPosRef && pts.length > 0) {
      const last = pts[pts.length - 1];
      (lastPosRef as React.MutableRefObject<THREE.Vector3 | null>).current = last.clone();
    }

    // Update Lyapunov indicator (throttled, only primary)
    if (!isSecondary && (showLyapunov || showPoincare)) {
      frameCounter.current++;
      if (frameCounter.current % 30 === 0) {
        setLyapunovExponent(lorenzSystem.lyapunovExponent);
      }
    }
  });

  const hStart = isSecondary ? theme.trailHue2 : theme.trailHue1;
  const hEnd = hStart + 0.2;
  const headColor = new THREE.Color().setHSL(hStart + 0.15, 1, 0.7);

  return (
    <group ref={groupRef} position={position}>
      <GradientTrail
        points={lorenzSystem.points}
        hueStart={hStart}
        hueEnd={hEnd}
        lineWidth={2.5}
        glowIntensity={0.5}
        scale={scale}
      />

      {lorenzSystem.points.length > 0 && (() => {
        const last = lorenzSystem.points[lorenzSystem.points.length - 1];
        return (
          <mesh position={[last.x * scale, last.y * scale, last.z * scale]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color={headColor} transparent opacity={0.9} />
          </mesh>
        );
      })()}
    </group>
  );
};
