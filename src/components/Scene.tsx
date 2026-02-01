import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { LorenzAttractor } from './LorenzAttractor';
import { RosslerAttractor } from './RosslerAttractor';
import { DoublePendulum } from './DoublePendulum';
import { useStore } from '../store/useStore';

const CameraControls: React.FC = () => {
  const { autoRotate, currentSystem } = useStore();
  
  return (
    <OrbitControls
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      autoRotate={autoRotate && currentSystem !== 'doublePendulum'}
      autoRotateSpeed={2}
      maxPolarAngle={Math.PI}
      minDistance={2}
      maxDistance={20}
    />
  );
};

const SystemRenderer: React.FC<{ 
  position?: [number, number, number]; 
  initialCondition?: any;
  colorHue?: number;
}> = ({ 
  position = [0, 0, 0], 
  initialCondition,
  colorHue = 0.6
}) => {
  const { currentSystem } = useStore();

  switch (currentSystem) {
    case 'lorenz':
      return (
        <LorenzAttractor 
          position={position}
          initialCondition={initialCondition || [1, 1, 1]}
          colorHue={colorHue}
        />
      );
    case 'rossler':
      return (
        <RosslerAttractor 
          position={position}
          initialCondition={initialCondition || [1, 1, 1]}
          colorHue={colorHue}
        />
      );
    case 'doublePendulum':
      return (
        <DoublePendulum 
          position={position}
          initialCondition={initialCondition || { theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0 }}
          colorHue={colorHue}
        />
      );
    default:
      return null;
  }
};

const SceneContent: React.FC = () => {
  const { sideBySideMode, currentSystem } = useStore();

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      
      {/* Grid floor for 2D systems */}
      {currentSystem === 'doublePendulum' && (
        <Grid
          args={[10, 10]}
          position={[0, -3, 0]}
          cellColor="#333333"
          sectionColor="#555555"
          fadeDistance={25}
          fadeStrength={1}
        />
      )}
      
      {sideBySideMode ? (
        <>
          {/* Left system - original initial conditions */}
          <SystemRenderer 
            position={[-2, 0, 0]}
            initialCondition={
              currentSystem === 'doublePendulum' 
                ? { theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0 }
                : [1, 1, 1]
            }
            colorHue={0.6}
          />
          
          {/* Right system - slightly different initial conditions */}
          <SystemRenderer 
            position={[2, 0, 0]}
            initialCondition={
              currentSystem === 'doublePendulum' 
                ? { theta1: Math.PI / 2 + 0.001, theta2: Math.PI / 2, omega1: 0, omega2: 0 }
                : [1.001, 1, 1]
            }
            colorHue={0.9}
          />
          
          {/* Divider line */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.01, 10, 0.01]} />
            <meshBasicMaterial color="#444444" />
          </mesh>
        </>
      ) : (
        <SystemRenderer />
      )}
      
      <CameraControls />
    </>
  );
};

export const Scene: React.FC = () => {
  const { currentSystem } = useStore();
  
  // Different camera settings for different systems
  const getCameraSettings = () => {
    switch (currentSystem) {
      case 'lorenz':
        return { position: [10, 10, 10], fov: 60 };
      case 'rossler':
        return { position: [8, 8, 8], fov: 60 };
      case 'doublePendulum':
        return { position: [0, 0, 5], fov: 50 };
      default:
        return { position: [10, 10, 10], fov: 60 };
    }
  };

  const cameraSettings = getCameraSettings();

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000010' }}>
      <Canvas
        camera={{
          position: cameraSettings.position as [number, number, number],
          fov: cameraSettings.fov,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <color attach="background" args={['#000010']} />
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
};