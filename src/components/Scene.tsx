import React, { Suspense, useRef, Component, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { LorenzAttractor } from './LorenzAttractor';
import { RosslerAttractor } from './RosslerAttractor';
import { DoublePendulum } from './DoublePendulum';
import { Starfield } from './Starfield';
import { CinematicCamera } from './CinematicCamera';
import { ChaosAutopilot } from './ChaosAutopilot';
import { TrailSparkles } from './TrailSparkles';
import { EnergyPulse } from './EnergyPulse';
import { ParticleSwarm } from './ParticleSwarm';
import { useStore, THEMES, type ChaosSystem } from '../store/useStore';
import { systemRef } from '../store/systemRef';
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
  const { autoRotate, currentSystem, cinematicCamera } = useStore();

  // Disable orbit controls when cinematic camera is active
  if (cinematicCamera) return null;

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

/* ─── divergence tracker (throttled to avoid per-frame state updates) ─── */
const DivTracker: React.FC<{
  posA: React.RefObject<THREE.Vector3 | null>;
  posB: React.RefObject<THREE.Vector3 | null>;
}> = ({ posA, posB }) => {
  const { setDivergence, sideBySideMode } = useStore();
  const frameCount = useRef(0);
  useFrame(() => {
    if (!sideBySideMode) return;
    frameCount.current++;
    if (frameCount.current % 6 !== 0) return; // ~10 updates/sec at 60fps
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

/* ─── dynamic bloom controller ─── */
const DynamicBloom: React.FC = () => {
  const { bloomEnabled, bloomIntensity, isPlaying } = useStore();
  const bloomRef = useRef<{ intensity: number } | null>(null);
  const smoothIntensity = useRef(bloomIntensity);

  useFrame(() => {
    if (!bloomEnabled || !bloomRef.current) return;

    if (!isPlaying) {
      bloomRef.current.intensity = bloomIntensity;
      return;
    }

    const system = systemRef.system;
    if (!system?.points || system.points.length < 5) {
      bloomRef.current.intensity = bloomIntensity;
      return;
    }

    const pts = system.points;
    const head = pts[pts.length - 1];
    const prev = pts[pts.length - 4];
    const vx = head.x - prev.x;
    const vy = head.y - prev.y;
    const vz = head.z - prev.z;
    const velocity = Math.sqrt(vx * vx + vy * vy + vz * vz);

    // Pulse bloom with velocity (subtle: ±30% of base intensity)
    const pulse = 1 + Math.min(velocity * 0.02, 0.3);
    const target = bloomIntensity * pulse;
    smoothIntensity.current += (target - smoothIntensity.current) * 0.05;
    bloomRef.current.intensity = smoothIntensity.current;
  });

  if (!bloomEnabled) return null;

  return (
    <EffectComposer>
      <Bloom
        ref={bloomRef}
        intensity={bloomIntensity}
        luminanceThreshold={0.1}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    </EffectComposer>
  );
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
      <CinematicCamera />
      <ChaosAutopilot />
      <TrailSparkles />
      <EnergyPulse />
      <ParticleSwarm />
      <DynamicBloom />
    </>
  );
};

/* ─── WebGL Error Boundary ─── */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class WebGLErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#000010', color: '#ccc',
          fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '2rem',
        }}>
          <h2 style={{ color: '#ff6666', marginBottom: '1rem' }}>⚠️ Rendering Error</h2>
          <p style={{ maxWidth: '400px', lineHeight: 1.6, marginBottom: '1rem' }}>
            The 3D visualization encountered an error. This can happen if WebGL is not available
            or if GPU resources were exhausted.
          </p>
          <code style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', color: '#ff9999', marginBottom: '1.5rem', maxWidth: '80vw', overflow: 'auto' }}>
            {this.state.error?.message || 'Unknown error'}
          </code>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '12px 24px', background: '#88ccff', color: '#000', border: 'none',
              borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            🔄 Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── scene wrapper ─── */
export const Scene: React.FC = () => {
  const { currentSystem, colorTheme } = useStore();
  const theme = THEMES[colorTheme];
  const cam = CAMERA_SETTINGS[currentSystem] ?? CAMERA_SETTINGS.lorenz;

  return (
    <WebGLErrorBoundary>
      <div
        style={{ width: '100vw', height: '100vh', background: theme.bg }}
        role="img"
        aria-label={`3D visualization of ${currentSystem === 'lorenz' ? 'Lorenz attractor' : currentSystem === 'rossler' ? 'Rössler attractor' : 'double pendulum'} chaos system`}
      >
        <Canvas
          camera={{ position: cam.position, fov: cam.fov }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
        >
          <color attach="background" args={[theme.bg]} />
          <fog attach="fog" args={[theme.bg, 30, 60]} />
          <Suspense fallback={null}>
            <SceneContent />
          </Suspense>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
};
