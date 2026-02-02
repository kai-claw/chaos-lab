import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, THEMES } from '../store/useStore';

const STAR_COUNT = 600;
const STAR_SPREAD = 80;
const ROTATION_SPEED = 0.02;

export const Starfield: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const { colorTheme } = useStore();
  const theme = THEMES[colorTheme];

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const sz = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * STAR_SPREAD;
      pos[i * 3 + 1] = (Math.random() - 0.5) * STAR_SPREAD;
      pos[i * 3 + 2] = (Math.random() - 0.5) * STAR_SPREAD;
      sz[i] = Math.random() * 1.5 + 0.3;
    }
    return { positions: pos, sizes: sz };
  }, []);

  // Cache the star color to avoid creating a new THREE.Color every render
  const starColor = useMemo(() => new THREE.Color(theme.starColor), [theme.starColor]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime() * ROTATION_SPEED;
    pointsRef.current.rotation.y = t;
    pointsRef.current.rotation.x = t * 0.3;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        color={starColor}
        size={0.08}
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
