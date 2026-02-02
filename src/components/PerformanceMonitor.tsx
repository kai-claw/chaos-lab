import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store/useStore';

/**
 * Adaptive Performance Monitor
 *
 * Tracks frame times inside the R3F render loop. If we detect sustained
 * frame drops (>20ms average over a window = <50fps), we:
 * 1. Show a performance warning so the user can reduce settings
 * 2. Auto-disable particle swarm if active (most expensive optional feature)
 *
 * This prevents the app from becoming a slideshow on weaker devices.
 * Runs as a no-render component inside the Canvas.
 */

const SAMPLE_WINDOW = 60;      // frames to average over
const WARN_THRESHOLD_MS = 22;  // ~45fps average triggers warning
const CRITICAL_THRESHOLD_MS = 33; // ~30fps triggers auto-downgrade

export const PerformanceMonitor: React.FC = () => {
  const frameTimes = useRef<Float32Array>(new Float32Array(SAMPLE_WINDOW));
  const frameIdx = useRef(0);
  const lastTime = useRef(0);
  const warningShown = useRef(false);
  const downgraded = useRef(false);
  const sampleCount = useRef(0);

  useFrame(({ clock }) => {
    const now = clock.getElapsedTime() * 1000; // ms
    if (lastTime.current > 0) {
      const dt = now - lastTime.current;
      frameTimes.current[frameIdx.current % SAMPLE_WINDOW] = dt;
      frameIdx.current++;
      sampleCount.current = Math.min(sampleCount.current + 1, SAMPLE_WINDOW);
    }
    lastTime.current = now;

    // Only check every 60 frames (once per window)
    if (frameIdx.current % SAMPLE_WINDOW !== 0 || sampleCount.current < SAMPLE_WINDOW) return;

    // Compute average frame time
    let sum = 0;
    for (let i = 0; i < SAMPLE_WINDOW; i++) {
      sum += frameTimes.current[i];
    }
    const avgMs = sum / SAMPLE_WINDOW;

    const store = useStore.getState();

    // Critical: auto-disable heavy features
    if (avgMs > CRITICAL_THRESHOLD_MS && !downgraded.current) {
      downgraded.current = true;
      if (store.particleSwarm) {
        useStore.setState({ particleSwarm: false });
      }
      if (store.trailLength > 1500) {
        useStore.setState({ trailLength: 1000 });
      }
      if (!store.showPerformanceWarning) {
        useStore.setState({ showPerformanceWarning: true });
      }
    }

    // Warning: show hint
    if (avgMs > WARN_THRESHOLD_MS && !warningShown.current) {
      warningShown.current = true;
      if (!store.showPerformanceWarning) {
        useStore.setState({ showPerformanceWarning: true });
      }
    }

    // Recovery: clear warning if performance improves
    if (avgMs < WARN_THRESHOLD_MS * 0.8 && warningShown.current) {
      warningShown.current = false;
      downgraded.current = false;
      if (store.showPerformanceWarning) {
        useStore.setState({ showPerformanceWarning: false });
      }
    }
  });

  return null;
};
