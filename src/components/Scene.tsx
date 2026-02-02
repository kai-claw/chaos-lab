import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { LorenzAttractor } from './LorenzAttractor';
import { RosslerAttractor } from './RosslerAttractor';
import { DoublePendulum } from './DoublePendulum';
import { Starfield } from './Starfield';
import { useStore, THEMES, type ChaosSystem } from '../store/useStore';
import type { PendulumState } from '../systems/doublePendulum';

/* ─── Types for initial conditions ─── */
type Vec3Tuple = [number, number, number];
type InitialCondition = Vec3Tuple | PendulumState;

/* ─── Camera presets per system ─── */
const CAMERA_SETTINGS: Record<ChaosSystem, { position: Vec3Tuple; fov: number }> = {
  lorenz:          { position: [10, 10, 10], fov: 60 },
  rossler:         { position: [8, 8, 8],    fov: 60 },
  doublePendulum:  { position: [0, 0, 5],    fov: 50 },
};

/* ─── camera controls ─── */
const CameraControls: React.FC = () => {
  const { autoRotate, currentSystem } = useStore();
  return (
    <OrbitControls
      enablePan enableZoom enableRotate
      autoRotate={autoRotate && currentSystem !== 'doublePendulum'}
      autoRotateSpeed={2}
      maxPolarAngle={Math.PI}
      minDistance={2}
      maxDistance={20}
    />
  );
};

/* ─── divergence tracker ─── */
const DivTracker: React.FC<{
  posA: React.RefObject<THREE.Vector3 | null>;
  posB: React.RefObject<THREE.Vector3 | null>;
}> = ({ posA, posB }) => {
  const { setDivergence, sideBySideMode } = useStore();
  useFrame(() => {
    if (!sideBySideMode) return;
    const a = posA.current;
    const b = posB.current;
    if (a && b) {
      setDivergence(a.distanceTo(b));
    }
  });
  return null;
};

/* ─── system renderer ─── */
interface SystemRendererProps {
  position?: Vec3Tuple;
  initialCondition?: InitialCondition;
  colorHue?: number;
  isSecondary?: boolean;
  lastPosRef?: React.RefObject<THREE.Vector3 | null>;
}

const SystemRenderer: React.FC<SystemRendererProps> = ({
  position = [0, 0, 0],
  initialCondition,
  colorHue = 0.6,
  isSecondary = false,
  lastPosRef,
}) => {
  const { currentSystem } = useStore();

  switch (currentSystem) {
    case 'lorenz':
      return (
        <LorenzAttractor
          position={position}
          initialCondition={(initialCondition as Vec3Tuple) || [1, 1, 1]}
          colorHue={colorHue}
          isSecondary={isSecondary}
          lastPosRef={lastPosRef}
        />
      );
    case 'rossler':
      return (
        <RosslerAttractor
          position={position}
          initialCondition={(initialCondition as Vec3Tuple) || [1, 1, 1]}
          colorHue={colorHue}
          isSecondary={isSecondary}
          lastPosRef={lastPosRef}
        />
      );
    case 'doublePendulum':
      return (
        <DoublePendulum
          position={position}
          initialCondition={(initialCondition as PendulumState) || { theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0 }}
          colorHue={colorHue}
          isSecondary={isSecondary}
          lastPosRef={lastPosRef}
        />
      );
    default:
      return null;
  }
};

/* ─── scene content ─── */
const SceneContent: React.FC = () => {
  const { sideBySideMode, currentSystem, initialOffset, colorTheme } = useStore();
  const theme = THEMES[colorTheme];

  const posARef = useRef<THREE.Vector3 | null>(null);
  const posBRef = useRef<THREE.Vector3 | null>(null);

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={0.3} />

      <Starfield />

      {currentSystem === 'doublePendulum' && (
        <Grid
          args={[10, 10]}
          position={[0, -3, 0]}
          cellColor="#222233"
          sectionColor="#333355"
          fadeDistance={25}
          fadeStrength={1}
        />
      )}

      {sideBySideMode ? (
        <>
          <SystemRenderer
            position={[0, 0, 0]}
            initialCondition={
              currentSystem === 'doublePendulum'
                ? { theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0 }
                : [1, 1, 1]
            }
            colorHue={theme.trailHue1}
            isSecondary={false}
            lastPosRef={posARef}
          />
          <SystemRenderer
            position={[0, 0, 0]}
            initialCondition={
              currentSystem === 'doublePendulum'
                ? { theta1: Math.PI / 2 + initialOffset, theta2: Math.PI / 2, omega1: 0, omega2: 0 }
                : [1 + initialOffset, 1, 1]
            }
            colorHue={theme.trailHue2}
            isSecondary={true}
            lastPosRef={posBRef}
          />
          <DivTracker posA={posARef} posB={posBRef} />
        </>
      ) : (
        <SystemRenderer />
      )}

      <CameraControls />
    </>
  );
};

/* ─── scene wrapper ─── */
export const Scene: React.FC = () => {
  const { currentSystem, colorTheme } = useStore();
  const theme = THEMES[colorTheme];
  const cam = CAMERA_SETTINGS[currentSystem] ?? CAMERA_SETTINGS.lorenz;

  return (
    <div
      style={{ width: '100vw', height: '100vh', background: theme.bg }}
      role="img"
      aria-label={`3D visualization of ${currentSystem === 'lorenz' ? 'Lorenz attractor' : currentSystem === 'rossler' ? 'Rössler attractor' : 'double pendulum'} chaos system`}
    >
      <Canvas
        camera={{ position: cam.position, fov: cam.fov }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={[theme.bg]} />
        <fog attach="fog" args={[theme.bg, 30, 60]} />
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
};
