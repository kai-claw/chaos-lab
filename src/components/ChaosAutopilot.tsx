import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore, type ChaosSystem } from '../store/useStore';

/**
 * Chaos Autopilot — smoothly morphs system parameters through interesting regions.
 * Creates a mesmerizing self-playing experience where the attractor
 * constantly reshapes itself as parameters glide through phase space.
 */

interface Waypoint {
  params: Record<string, number>;
  duration: number; // seconds to spend at this waypoint
  transitionTime: number; // seconds to transition to next waypoint
}

const LORENZ_JOURNEY: Waypoint[] = [
  { params: { sigma: 10, rho: 28, beta: 2.667 }, duration: 5, transitionTime: 4 },
  { params: { sigma: 10, rho: 15, beta: 2.667 }, duration: 3, transitionTime: 5 }, // Stable
  { params: { sigma: 10, rho: 24.06, beta: 2.667 }, duration: 4, transitionTime: 4 }, // Hopf bifurcation
  { params: { sigma: 10, rho: 28, beta: 2.667 }, duration: 3, transitionTime: 3 }, // Classic
  { params: { sigma: 14, rho: 35, beta: 3 }, duration: 4, transitionTime: 5 }, // Wilder
  { params: { sigma: 10, rho: 99.96, beta: 2.667 }, duration: 5, transitionTime: 6 }, // High rho
  { params: { sigma: 10, rho: 45, beta: 2.667 }, duration: 3, transitionTime: 4 }, // Coming back
  { params: { sigma: 10, rho: 28, beta: 2.667 }, duration: 3, transitionTime: 4 }, // Classic return
];

const ROSSLER_JOURNEY: Waypoint[] = [
  { params: { a: 0.2, b: 0.2, c: 3.5 }, duration: 4, transitionTime: 5 }, // Period-1
  { params: { a: 0.2, b: 0.2, c: 4.0 }, duration: 3, transitionTime: 4 }, // Period-2
  { params: { a: 0.2, b: 0.2, c: 5.0 }, duration: 3, transitionTime: 4 }, // Period-4
  { params: { a: 0.2, b: 0.2, c: 5.7 }, duration: 4, transitionTime: 3 }, // Chaos
  { params: { a: 0.2, b: 0.2, c: 8.5 }, duration: 4, transitionTime: 5 }, // Strong chaos
  { params: { a: 0.3, b: 0.3, c: 12.0 }, duration: 5, transitionTime: 5 }, // Extreme
  { params: { a: 0.2, b: 0.2, c: 5.7 }, duration: 3, transitionTime: 6 }, // Return
];

const PENDULUM_JOURNEY: Waypoint[] = [
  { params: { mass1: 1, mass2: 1, length1: 1, length2: 1, gravity: 9.81, damping: 0 }, duration: 5, transitionTime: 4 },
  { params: { mass1: 1, mass2: 3, length1: 1, length2: 1, gravity: 9.81, damping: 0 }, duration: 4, transitionTime: 5 },
  { params: { mass1: 2, mass2: 1, length1: 1.5, length2: 0.5, gravity: 9.81, damping: 0 }, duration: 4, transitionTime: 5 },
  { params: { mass1: 1, mass2: 1, length1: 1, length2: 1, gravity: 15, damping: 0 }, duration: 4, transitionTime: 4 },
  { params: { mass1: 1, mass2: 1, length1: 1, length2: 1, gravity: 5, damping: 0.02 }, duration: 5, transitionTime: 5 },
  { params: { mass1: 1, mass2: 1, length1: 1, length2: 1, gravity: 9.81, damping: 0 }, duration: 3, transitionTime: 4 },
];

const JOURNEYS: Record<ChaosSystem, Waypoint[]> = {
  lorenz: LORENZ_JOURNEY,
  rossler: ROSSLER_JOURNEY,
  doublePendulum: PENDULUM_JOURNEY,
};

/** Smooth interpolation between parameter sets */
function lerpParams(
  from: Record<string, number>,
  to: Record<string, number>,
  t: number
): Record<string, number> {
  const result: Record<string, number> = {};
  // Smoothstep easing for buttery transitions
  const eased = t * t * (3 - 2 * t);
  for (const key of Object.keys(from)) {
    const a = from[key] ?? 0;
    const b = to[key] ?? a;
    result[key] = a + (b - a) * eased;
  }
  return result;
}

export const ChaosAutopilot: React.FC = () => {
  const {
    chaosAutopilot, currentSystem,
    setLorenzParams, setRosslerParams, setDoublePendulumParams,
    setCurrentPreset,
  } = useStore();

  const timeRef = useRef(0);
  const waypointRef = useRef(0);
  const phaseRef = useRef<'dwell' | 'transition'>('dwell');
  const phaseTimeRef = useRef(0);

  // Reset when toggled or system changes
  useEffect(() => {
    timeRef.current = 0;
    waypointRef.current = 0;
    phaseRef.current = 'dwell';
    phaseTimeRef.current = 0;
  }, [chaosAutopilot, currentSystem]);

  useFrame((_, delta) => {
    if (!chaosAutopilot) return;

    const journey = JOURNEYS[currentSystem];
    if (!journey || journey.length === 0) return;

    const currentIdx = waypointRef.current % journey.length;
    const nextIdx = (currentIdx + 1) % journey.length;
    const current = journey[currentIdx];
    const next = journey[nextIdx];

    phaseTimeRef.current += delta;

    if (phaseRef.current === 'dwell') {
      // Dwelling at current waypoint
      if (phaseTimeRef.current >= current.duration) {
        phaseRef.current = 'transition';
        phaseTimeRef.current = 0;
      }
    } else {
      // Transitioning to next waypoint
      const t = Math.min(1, phaseTimeRef.current / current.transitionTime);
      const interpolated = lerpParams(current.params, next.params, t);

      // Apply interpolated parameters
      switch (currentSystem) {
        case 'lorenz':
          setLorenzParams(interpolated);
          break;
        case 'rossler':
          setRosslerParams(interpolated);
          break;
        case 'doublePendulum':
          setDoublePendulumParams(interpolated);
          break;
      }
      setCurrentPreset(null);

      if (t >= 1) {
        waypointRef.current = nextIdx;
        phaseRef.current = 'dwell';
        phaseTimeRef.current = 0;
      }
    }

    timeRef.current += delta;
  });

  return null;
};

/** Get current waypoint info for display */
export function getAutopilotStatus(
  currentSystem: ChaosSystem,
  _time: number
): string {
  const journey = JOURNEYS[currentSystem];
  if (!journey) return '';
  return `Exploring ${journey.length} parameter regions...`;
}
