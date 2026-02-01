import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { RosslerSystem } from '../systems/rossler';
import { useStore } from '../store/useStore';

interface RosslerAttractorProps {
  position?: [number, number, number];
  scale?: number;
  initialCondition?: [number, number, number];
  colorHue?: number;
}

export const RosslerAttractor: React.FC<RosslerAttractorProps> = ({
  position = [0, 0, 0],
  scale = 0.5,
  initialCondition = [1, 1, 1],
  colorHue = 0.1,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { 
    isPlaying, 
    speed, 
    trailLength, 
    rosslerParams,
    resetSimulation 
  } = useStore();
  
  const rosslerSystem = useMemo(() => {
    const initialPos = new THREE.Vector3(...initialCondition);
    return new RosslerSystem(initialPos, rosslerParams);
  }, [initialCondition, rosslerParams.a, rosslerParams.b, rosslerParams.c]);

  // Listen for reset
  const prevResetTime = useRef(Date.now());
  useEffect(() => {
    const newTime = Date.now();
    if (newTime - prevResetTime.current > 50) { // debounce
      rosslerSystem.reset(new THREE.Vector3(...initialCondition));
      prevResetTime.current = newTime;
    }
  }, [resetSimulation, rosslerSystem, initialCondition]);

  // Update parameters when they change
  useEffect(() => {
    rosslerSystem.updateParams(rosslerParams);
  }, [rosslerParams, rosslerSystem]);

  useFrame(() => {
    if (!isPlaying) return;
    
    // Step the simulation
    rosslerSystem.step(speed * 0.5);
    
    // Trim trail
    rosslerSystem.trimTrail(trailLength);
  });

  // Create trail geometry
  const trailGeometry = useMemo(() => {
    const points = rosslerSystem.points.map(p => 
      new THREE.Vector3(p.x * scale, p.y * scale, p.z * scale)
    );
    return points;
  }, [rosslerSystem.points, scale]);

  // Create color array for time-based coloring
  const colors = useMemo(() => {
    const colorsArray = [];
    for (let i = 0; i < rosslerSystem.points.length; i++) {
      const t = i / Math.max(1, rosslerSystem.points.length - 1);
      const color = new THREE.Color();
      color.setHSL(colorHue + t * 0.4, 0.9, 0.4 + t * 0.5);
      colorsArray.push(color.r, color.g, color.b);
    }
    return colorsArray;
  }, [rosslerSystem.points, colorHue]);

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
      {rosslerSystem.points.length > 0 && (
        <mesh position={[
          rosslerSystem.points[rosslerSystem.points.length - 1].x * scale,
          rosslerSystem.points[rosslerSystem.points.length - 1].y * scale,
          rosslerSystem.points[rosslerSystem.points.length - 1].z * scale,
        ]}>
          <sphereGeometry args={[0.03]} />
          <meshBasicMaterial color={new THREE.Color().setHSL(colorHue, 1, 0.8)} />
        </mesh>
      )}
    </group>
  );
};