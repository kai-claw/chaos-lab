import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { DoublePendulumSystem } from '../systems/doublePendulum';
import { useStore } from '../store/useStore';

interface DoublePendulumProps {
  position?: [number, number, number];
  scale?: number;
  initialCondition?: { theta1: number; theta2: number; omega1: number; omega2: number };
  colorHue?: number;
}

export const DoublePendulum: React.FC<DoublePendulumProps> = ({
  position = [0, 0, 0],
  scale = 1.0,
  initialCondition = { theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0 },
  colorHue = 0.9,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { 
    isPlaying, 
    speed, 
    trailLength, 
    doublePendulumParams,
    resetSimulation 
  } = useStore();
  
  const pendulumSystem = useMemo(() => {
    return new DoublePendulumSystem(initialCondition, doublePendulumParams);
  }, [
    initialCondition.theta1, 
    initialCondition.theta2, 
    initialCondition.omega1, 
    initialCondition.omega2,
    doublePendulumParams.mass1,
    doublePendulumParams.mass2,
    doublePendulumParams.length1,
    doublePendulumParams.length2,
    doublePendulumParams.gravity,
    doublePendulumParams.damping
  ]);

  // Listen for reset
  const prevResetTime = useRef(Date.now());
  useEffect(() => {
    const newTime = Date.now();
    if (newTime - prevResetTime.current > 50) { // debounce
      pendulumSystem.reset(initialCondition);
      prevResetTime.current = newTime;
    }
  }, [resetSimulation, pendulumSystem, initialCondition]);

  // Update parameters when they change
  useEffect(() => {
    pendulumSystem.updateParams(doublePendulumParams);
  }, [doublePendulumParams, pendulumSystem]);

  useFrame(() => {
    if (!isPlaying) return;
    
    // Step the simulation
    pendulumSystem.step(speed * 2.0);
    
    // Trim trail
    pendulumSystem.trimTrail(trailLength);
  });

  // Get current pendulum positions
  const currentPos = pendulumSystem.positions.length > 0 
    ? pendulumSystem.getCurrentPositions()
    : { p1: { x: 0, y: 0 }, p2: { x: 0, y: 0 } };

  // Create trail geometry (second pendulum tip)
  const trailGeometry = useMemo(() => {
    const points = pendulumSystem.points.map(p => 
      new THREE.Vector3(p.x * scale, p.y * scale, 0)
    );
    return points;
  }, [pendulumSystem.points, scale]);

  // Create color array for trail
  const colors = useMemo(() => {
    const colorsArray = [];
    for (let i = 0; i < pendulumSystem.points.length; i++) {
      const t = i / Math.max(1, pendulumSystem.points.length - 1);
      const alpha = Math.pow(t, 2); // fade older parts
      const color = new THREE.Color();
      color.setHSL(colorHue, 0.8, 0.3 + alpha * 0.6);
      colorsArray.push(color.r, color.g, color.b);
    }
    return colorsArray;
  }, [pendulumSystem.points, colorHue]);

  // Pendulum rod geometry
  const rod1Points = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(currentPos.p1.x * scale, currentPos.p1.y * scale, 0)
  ];
  
  const rod2Points = [
    new THREE.Vector3(currentPos.p1.x * scale, currentPos.p1.y * scale, 0),
    new THREE.Vector3(currentPos.p2.x * scale, currentPos.p2.y * scale, 0)
  ];

  return (
    <group ref={groupRef} position={position}>
      {/* Trail of second pendulum */}
      {trailGeometry.length > 1 && (
        <Line
          points={trailGeometry}
          color="white"
          lineWidth={1.5}
          // @ts-ignore - Line component accepts these props
          vertexColors={colors}
        />
      )}
      
      {/* Pendulum rods */}
      <Line
        points={rod1Points}
        color="#888888"
        lineWidth={3}
      />
      
      <Line
        points={rod2Points}
        color="#AAAAAA"
        lineWidth={3}
      />
      
      {/* Pivot point */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.02]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      
      {/* First pendulum mass */}
      <mesh position={[currentPos.p1.x * scale, currentPos.p1.y * scale, 0]}>
        <sphereGeometry args={[0.05 * Math.sqrt(doublePendulumParams.mass1)]} />
        <meshBasicMaterial color={new THREE.Color().setHSL(colorHue, 0.8, 0.6)} />
      </mesh>
      
      {/* Second pendulum mass */}
      <mesh position={[currentPos.p2.x * scale, currentPos.p2.y * scale, 0]}>
        <sphereGeometry args={[0.05 * Math.sqrt(doublePendulumParams.mass2)]} />
        <meshBasicMaterial color={new THREE.Color().setHSL(colorHue + 0.1, 0.8, 0.7)} />
      </mesh>
    </group>
  );
};