import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, THEMES } from '../store/useStore';

const STAR_COUNT = 800;
const STAR_SPREAD = 80;
const ROTATION_SPEED = 0.02;

export const Starfield: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const { colorTheme } = useStore();
  const theme = THEMES[colorTheme];

  const { positions, baseSizes, phases, speeds } = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const sz = new Float32Array(STAR_COUNT);
    const ph = new Float32Array(STAR_COUNT);
    const sp = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * STAR_SPREAD;
      pos[i * 3 + 1] = (Math.random() - 0.5) * STAR_SPREAD;
      pos[i * 3 + 2] = (Math.random() - 0.5) * STAR_SPREAD;
      sz[i] = Math.random() * 1.5 + 0.3;
      ph[i] = Math.random() * Math.PI * 2;    // random phase for twinkling
      sp[i] = 0.5 + Math.random() * 2.5;      // twinkling speed
    }
    return { positions: pos, baseSizes: sz, phases: ph, speeds: sp };
  }, []);

  // Live size buffer for twinkling
  const sizeBuffer = useMemo(() => new Float32Array(STAR_COUNT), []);
  const sizeAttrRef = useRef<THREE.BufferAttribute>(null);

  // Cache the star color to avoid creating a new THREE.Color every render
  const starColor = useMemo(() => new THREE.Color(theme.starColor), [theme.starColor]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const rot = t * ROTATION_SPEED;
    pointsRef.current.rotation.y = rot;
    pointsRef.current.rotation.x = rot * 0.3;

    // Twinkle: modulate sizes with sin wave per star
    for (let i = 0; i < STAR_COUNT; i++) {
      const twinkle = 0.6 + 0.4 * Math.sin(t * speeds[i] + phases[i]);
      sizeBuffer[i] = baseSizes[i] * twinkle;
    }
    if (sizeAttrRef.current) {
      sizeAttrRef.current.set(sizeBuffer);
      sizeAttrRef.current.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute ref={sizeAttrRef} attach="attributes-size" args={[new Float32Array(STAR_COUNT), 1]} />
      </bufferGeometry>
      <pointsMaterial
        color={starColor}
        size={0.09}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
