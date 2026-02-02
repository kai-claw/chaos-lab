import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * TrailHeadGlow — A dramatic glowing marker at the trail head.
 * Features a bright core sphere, a pulsing outer ring, and a point light
 * that illuminates the surrounding trail for a "living fire" effect.
 */

interface TrailHeadGlowProps {
  position: [number, number, number];
  color: THREE.Color;
  /** Intensity of the point light (0 to disable) */
  lightIntensity?: number;
  /** Scale multiplier for the glow */
  size?: number;
  /** Whether to show the expanding pulse ring */
  showPulse?: boolean;
}

export const TrailHeadGlow: React.FC<TrailHeadGlowProps> = ({
  position,
  color,
  lightIntensity = 0.8,
  size = 1.0,
  showPulse = true,
}) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(Math.random() * Math.PI * 2);

  // Slightly brighter version of the color for the core
  const coreColor = useMemo(() => {
    const c = color.clone();
    c.offsetHSL(0, 0.1, 0.2);
    return c;
  }, [color]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    phaseRef.current += 0.04;

    // Core sphere breathing
    if (coreRef.current) {
      const breathe = 1.0 + Math.sin(t * 3.0) * 0.15;
      const s = 0.05 * size * breathe;
      coreRef.current.scale.setScalar(s / (0.05 * size) || 1);
    }

    // Outer glow breathing (inverse phase for visual depth)
    if (outerRef.current) {
      const breathe = 1.0 + Math.sin(t * 3.0 + Math.PI) * 0.2;
      const mat = outerRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + Math.sin(t * 2.5) * 0.08;
      const s = 0.12 * size * breathe;
      outerRef.current.scale.setScalar(s / (0.12 * size) || 1);
    }

    // Pulse ring — expands outward and fades
    if (ringRef.current && showPulse) {
      const cycle = (t * 1.2) % 2.0; // 2-second cycle
      const ringScale = 0.05 + cycle * 0.15 * size;
      ringRef.current.scale.set(ringScale, ringScale, 1);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.4 * (1 - cycle / 2.0));
    }
  });

  return (
    <group position={position}>
      {/* Ambient fill light — subtle warmth on nearby trail (complements EnergyPulse) */}
      {lightIntensity > 0 && (
        <pointLight
          color={color}
          intensity={lightIntensity * 0.4}
          distance={1.5 * size}
          decay={2}
        />
      )}

      {/* Outer soft glow */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[0.12 * size, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Core sphere — bright and solid */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.05 * size, 16, 16]} />
        <meshBasicMaterial
          color={coreColor}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Pulse ring — expanding ripple effect */}
      {showPulse && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.0, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
};
