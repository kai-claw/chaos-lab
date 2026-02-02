import type { Vector3 } from 'three';

/**
 * Module-level reference to the currently active chaos system instance.
 *
 * Replaces the `window.__chaosLabSystem` / `window.__chaosLabSystemType`
 * global pattern with a properly typed, import-based alternative.
 *
 * This is intentionally NOT React state — it's a mutable ref that
 * per-frame R3F `useFrame` callbacks can read without triggering re-renders.
 *
 * Write: attractor components (LorenzAttractor, RosslerAttractor, DoublePendulum)
 * Read:  CinematicCamera, TrailSparkles, EnergyPulse, ChaosSynth, DynamicBloom
 */

/** Minimal interface that all chaos system classes satisfy */
export interface ChaosSystemRef {
  points: Vector3[];
  lyapunovExponent: number;
  poincarePoints: [number, number][];
}

export type SystemType = 'lorenz' | 'rossler' | 'doublePendulum';

interface SystemRefState {
  /** The active system instance (null when none is mounted) */
  system: ChaosSystemRef | null;
  /** Which system type is active */
  type: SystemType | null;
}

/** Shared module-level ref — imported by producers and consumers alike */
export const systemRef: SystemRefState = {
  system: null,
  type: null,
};

/** Called by attractor components when they mount / become primary */
export function setActiveSystem(system: ChaosSystemRef, type: SystemType): void {
  systemRef.system = system;
  systemRef.type = type;
}

/** Called by attractor components on cleanup — only clears if still the active one */
export function clearActiveSystem(system: ChaosSystemRef): void {
  if (systemRef.system === system) {
    systemRef.system = null;
    systemRef.type = null;
  }
}

/** Apply a random perturbation to the active system.
 *  Each system class implements a `perturb(amount)` method. */
export function perturbActiveSystem(amount: number): void {
  const sys = systemRef.system;
  if (sys && typeof (sys as ChaosSystemRef & { perturb?: (a: number) => void }).perturb === 'function') {
    (sys as ChaosSystemRef & { perturb: (a: number) => void }).perturb(amount);
  }
}
