/**
 * Ghost Trail Storage — module-level store for captured trail snapshots.
 * Lives outside React/Zustand to avoid putting large Float32Arrays in state.
 * Components react to version changes via the Zustand ghostTrailVersion counter.
 */
import type { Vector3 } from 'three';

export interface GhostTrail {
  /** Pre-scaled flat position array [x,y,z, x,y,z, ...] */
  positions: Float32Array;
  /** Number of valid points */
  count: number;
  /** Hue for coloring */
  hue: number;
  /** Whether this is a 2D system (z=0) */
  flat: boolean;
}

const SCALE_MAP: Record<string, number> = {
  lorenz: 0.1,
  rossler: 0.5,
  doublePendulum: 1.0,
};

const MAX_GHOSTS = 5;
const MAX_GHOST_POINTS = 6000;

const ghosts: GhostTrail[] = [];

/**
 * Capture the current trail as a frozen ghost.
 * Clones and pre-scales the point data so the ghost is independent of the live system.
 */
export function captureGhost(
  points: Vector3[],
  system: string,
  hue: number,
): void {
  const scale = SCALE_MAP[system] ?? 0.1;
  const flat = system === 'doublePendulum';
  const count = Math.min(points.length, MAX_GHOST_POINTS);
  const positions = new Float32Array(count * 3);
  const start = Math.max(0, points.length - count);

  for (let i = 0; i < count; i++) {
    const p = points[start + i];
    const i3 = i * 3;
    positions[i3] = p.x * scale;
    positions[i3 + 1] = p.y * scale;
    positions[i3 + 2] = flat ? 0 : p.z * scale;
  }

  ghosts.push({ positions, count, hue, flat });
  if (ghosts.length > MAX_GHOSTS) {
    ghosts.shift();
  }
}

/** Remove all captured ghosts. */
export function clearGhosts(): void {
  ghosts.length = 0;
}

/** Get the current array of ghosts (read-only reference). */
export function getGhosts(): readonly GhostTrail[] {
  return ghosts;
}

/** Get ghost count for UI display. */
export function getGhostCount(): number {
  return ghosts.length;
}
