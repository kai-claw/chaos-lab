import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, THEMES } from '../store/useStore';

/**
 * Energy Pulse — a dynamic point light that follows the trail head.
 * Intensity and color shift based on the system's velocity, creating
 * a "living energy" effect that makes the attractor feel alive.
 *
 * When the attractor whips through high-energy regions, the light
 * blazes bright. In calm regions, it dims to a gentle glow.
 * Combined with bloom, this creates stunning volumetric-looking effects.
 */

const SCALE_MAP: Record<string, number> = {
  lorenz: 0.1,
  rossler: 0.5,
  doublePendulum: 1.0,
};

export const EnergyPulse: React.FC = () => {
  const { isPlaying, currentSystem, colorTheme, bloomEnabled } = useStore();
  const theme = THEMES[colorTheme];
  const lightRef = useRef<THREE.PointLight>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const prevPos = useRef(new THREE.Vector3());
  const smoothVel = useRef(0);
  const smoothIntensity = useRef(0);

  useFrame(() => {
    if (!isPlaying || !lightRef.current || !meshRef.current) return;

    const system = (window as unknown as Record<string, unknown>).__chaosLabSystem as
      | { points: THREE.Vector3[] }
      | undefined;
    if (!system?.points || system.points.length < 3) return;

    const pts = system.points;
    const scale = SCALE_MAP[currentSystem] ?? 0.1;
    const head = pts[pts.length - 1];

    const worldX = head.x * scale;
    const worldY = head.y * scale;
    const worldZ = currentSystem === 'doublePendulum' ? 0.1 : head.z * scale;

    // Calculate velocity
    const vx = worldX - prevPos.current.x;
    const vy = worldY - prevPos.current.y;
    const vz = worldZ - prevPos.current.z;
    const velocity = Math.sqrt(vx * vx + vy * vy + vz * vz);
    prevPos.current.set(worldX, worldY, worldZ);

    // Smooth the velocity for pleasing visual
    smoothVel.current += (velocity - smoothVel.current) * 0.08;

    // Map velocity to intensity (stronger with bloom enabled)
    const baseIntensity = bloomEnabled ? 0.8 : 0.3;
    const velBoost = Math.min(smoothVel.current * 8, 2.0);
    const targetIntensity = baseIntensity + velBoost;
    smoothIntensity.current += (targetIntensity - smoothIntensity.current) * 0.06;

    // Update light
    lightRef.current.position.set(worldX, worldY, worldZ);
    lightRef.current.intensity = smoothIntensity.current;
    lightRef.current.distance = 3 + smoothVel.current * 10;

    // Update glow mesh
    meshRef.current.position.set(worldX, worldY, worldZ);
    const pulseScale = 0.03 + smoothVel.current * 0.15;
    meshRef.current.scale.setScalar(pulseScale);

    // Color: shift toward white/brighter at high velocity
    const baseColor = new THREE.Color(theme.accent);
    const white = new THREE.Color(1, 1, 1);
    const velFactor = Math.min(smoothVel.current * 3, 0.6);
    const lerpedColor = baseColor.lerp(white, velFactor);
    lightRef.current.color.copy(lerpedColor);
    (meshRef.current.material as THREE.MeshBasicMaterial).color.copy(lerpedColor);
  });

  return (
    <>
      <pointLight
        ref={lightRef}
        intensity={0.5}
        distance={5}
        decay={2}
        color={theme.accent}
      />
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={theme.accent}
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
};
