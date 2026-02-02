import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, THEMES } from '../store/useStore';

export const Starfield: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const { colorTheme } = useStore();
  const theme = THEMES[colorTheme];

  const COUNT = 600;

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const sz = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      sz[i] = Math.random() * 1.5 + 0.3;
    }
    return { positions: pos, sizes: sz };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime() * 0.02;
    pointsRef.current.rotation.y = t;
    pointsRef.current.rotation.x = t * 0.3;
  });

  const starColor = new THREE.Color(theme.starColor);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
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
