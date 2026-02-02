import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RosslerSystem } from '../systems/rossler';
import { useStore, THEMES } from '../store/useStore';
import { GradientTrail } from './GradientTrail';

interface RosslerAttractorProps {
  position?: [number, number, number];
  scale?: number;
  initialCondition?: [number, number, number];
  colorHue?: number;
  isSecondary?: boolean;
  lastPosRef?: React.RefObject<THREE.Vector3 | null>;
}

export const RosslerAttractor: React.FC<RosslerAttractorProps> = ({
  position = [0, 0, 0],
  scale = 0.5,
  initialCondition = [1, 1, 1],
  isSecondary = false,
  lastPosRef,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { 
    isPlaying, speed, trailLength, rosslerParams, _resetCounter, colorTheme,
  } = useStore();
  const theme = THEMES[colorTheme];
  
  const rosslerSystem = useMemo(() => {
    const initialPos = new THREE.Vector3(...initialCondition);
    return new RosslerSystem(initialPos, rosslerParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCondition[0], initialCondition[1], initialCondition[2], rosslerParams.a, rosslerParams.b, rosslerParams.c]);

  useEffect(() => {
    rosslerSystem.reset(new THREE.Vector3(...initialCondition));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_resetCounter]);

  useEffect(() => {
    rosslerSystem.updateParams(rosslerParams);
  }, [rosslerParams, rosslerSystem]);

  const scaledPoints = useRef<THREE.Vector3[]>([]);

  useFrame(() => {
    if (!isPlaying) return;
    rosslerSystem.step(speed * 0.5);
    rosslerSystem.trimTrail(trailLength);

    const pts = rosslerSystem.points;
    const sp: THREE.Vector3[] = [];
    for (let i = 0; i < pts.length; i++) {
      sp.push(new THREE.Vector3(pts[i].x * scale, pts[i].y * scale, pts[i].z * scale));
    }
    scaledPoints.current = sp;

    if (lastPosRef && pts.length > 0) {
      const last = pts[pts.length - 1];
      (lastPosRef as React.MutableRefObject<THREE.Vector3 | null>).current = last.clone();
    }
  });

  const hStart = isSecondary ? theme.trailHue2 : theme.trailHue1;
  const hEnd = hStart + 0.25;
  const headColor = new THREE.Color().setHSL(hStart + 0.15, 1, 0.8);

  return (
    <group ref={groupRef} position={position}>
      <GradientTrail
        points={scaledPoints.current}
        hueStart={hStart}
        hueEnd={hEnd}
        lineWidth={2.5}
        glowIntensity={0.5}
      />
      
      {rosslerSystem.points.length > 0 && (() => {
        const last = rosslerSystem.points[rosslerSystem.points.length - 1];
        return (
          <mesh position={[last.x * scale, last.y * scale, last.z * scale]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshBasicMaterial color={headColor} transparent opacity={0.9} />
          </mesh>
        );
      })()}
    </group>
  );
};
