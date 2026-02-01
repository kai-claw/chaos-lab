import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { LorenzSystem } from '../systems/lorenz';
import { useStore } from '../store/useStore';

interface LorenzAttractorProps {
  position?: [number, number, number];
  scale?: number;
  initialCondition?: [number, number, number];
  colorHue?: number;
}

export const LorenzAttractor: React.FC<LorenzAttractorProps> = ({
  position = [0, 0, 0],
  scale = 0.1,
  initialCondition = [1, 1, 1],
  colorHue = 0.6,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { 
    isPlaying, 
    speed, 
    trailLength, 
    lorenzParams,
    resetSimulation 
  } = useStore();
  
  const lorenzSystem = useMemo(() => {
    const initialPos = new THREE.Vector3(...initialCondition);
    return new LorenzSystem(initialPos, lorenzParams);
  }, [initialCondition, lorenzParams.sigma, lorenzParams.rho, lorenzParams.beta]);

  // Listen for reset
  const prevResetTime = useRef(Date.now());
  useEffect(() => {
    const newTime = Date.now();
    if (newTime - prevResetTime.current > 50) { // debounce
      lorenzSystem.reset(new THREE.Vector3(...initialCondition));
      prevResetTime.current = newTime;
    }
  }, [resetSimulation, lorenzSystem, initialCondition]);

  // Update parameters when they change
  useEffect(() => {
    lorenzSystem.updateParams(lorenzParams);
  }, [lorenzParams, lorenzSystem]);

  useFrame(() => {
    if (!isPlaying) return;
    
    // Step the simulation
    lorenzSystem.step(speed * 0.5);
    
    // Trim trail
    lorenzSystem.trimTrail(trailLength);
  });

  // Create trail geometry
  const trailGeometry = useMemo(() => {
    const points = lorenzSystem.points.map(p => 
      new THREE.Vector3(p.x * scale, p.y * scale, p.z * scale)
    );
    return points;
  }, [lorenzSystem.points, scale]);

  // Create color array for speed-based coloring (optimized)
  const colors = useMemo(() => {
    const colorsArray = [];
    const pointsLength = lorenzSystem.points.length;
    
    for (let i = 0; i < pointsLength; i++) {
      const t = i / Math.max(1, pointsLength - 1);
      const hue = colorHue + t * 0.3;
      const lightness = 0.5 + t * 0.4;
      
      // Optimized HSL to RGB conversion
      const c = (1 - Math.abs(2 * lightness - 1)) * 0.8;
      const x = c * (1 - Math.abs(((hue * 6) % 2) - 1));
      const m = lightness - c / 2;
      
      let r = 0, g = 0, b = 0;
      const hueSector = Math.floor(hue * 6) % 6;
      
      switch (hueSector) {
        case 0: r = c; g = x; b = 0; break;
        case 1: r = x; g = c; b = 0; break;
        case 2: r = 0; g = c; b = x; break;
        case 3: r = 0; g = x; b = c; break;
        case 4: r = x; g = 0; b = c; break;
        case 5: r = c; g = 0; b = x; break;
      }
      
      colorsArray.push(r + m, g + m, b + m);
    }
    return colorsArray;
  }, [lorenzSystem.points.length, colorHue]);

  return (
    <group ref={groupRef} position={position}>
      {trailGeometry.length > 1 && (
        <Line
          points={trailGeometry}
          color="white"
          lineWidth={2}
          // @ts-ignore - Line component accepts these props
          vertexColors={colors}
        />
      )}
      
      {/* Current position marker */}
      {lorenzSystem.points.length > 0 && (
        <mesh position={[
          lorenzSystem.points[lorenzSystem.points.length - 1].x * scale,
          lorenzSystem.points[lorenzSystem.points.length - 1].y * scale,
          lorenzSystem.points[lorenzSystem.points.length - 1].z * scale,
        ]}>
          <sphereGeometry args={[0.02]} />
          <meshBasicMaterial color={new THREE.Color().setHSL(colorHue, 1, 0.7)} />
        </mesh>
      )}
    </group>
  );
};