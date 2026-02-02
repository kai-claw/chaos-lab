import { describe, it, expect, beforeEach } from 'vitest';
import { Vector3 } from 'three';
import { LorenzSystem } from './lorenz';

describe('LorenzSystem', () => {
  let system: LorenzSystem;

  beforeEach(() => {
    system = new LorenzSystem(new Vector3(1, 1, 1), { sigma: 10, rho: 28, beta: 8 / 3 });
  });

  describe('initialization', () => {
    it('starts with a single point at initial position', () => {
      expect(system.points).toHaveLength(1);
      expect(system.points[0].x).toBe(1);
      expect(system.points[0].y).toBe(1);
      expect(system.points[0].z).toBe(1);
    });

    it('starts with zeroed Lyapunov exponent', () => {
      expect(system.lyapunovExponent).toBe(0);
    });

    it('starts with empty Poincaré points', () => {
      expect(system.poincarePoints).toHaveLength(0);
    });
  });

  describe('step()', () => {
    it('adds a new point each step', () => {
      system.step(1.0);
      expect(system.points).toHaveLength(2);
      system.step(1.0);
      expect(system.points).toHaveLength(3);
    });

    it('returns a cloned position (not a reference)', () => {
      const pos = system.step(1.0);
      const last = system.points[system.points.length - 1];
      expect(pos).not.toBe(last);
      expect(pos.x).toBe(last.x);
    });

    it('produces finite coordinates under standard parameters', () => {
      for (let i = 0; i < 1000; i++) {
        const pos = system.step(1.0);
        expect(Number.isFinite(pos.x)).toBe(true);
        expect(Number.isFinite(pos.y)).toBe(true);
        expect(Number.isFinite(pos.z)).toBe(true);
      }
    });

    it('stays bounded for the classic Lorenz attractor', () => {
      for (let i = 0; i < 5000; i++) {
        system.step(1.0);
      }
      const last = system.points[system.points.length - 1];
      expect(Math.abs(last.x)).toBeLessThan(100);
      expect(Math.abs(last.y)).toBeLessThan(100);
      expect(Math.abs(last.z)).toBeLessThan(100);
    });

    it('moves the position (not stuck at initial)', () => {
      system.step(1.0);
      const pos = system.points[1];
      expect(pos.distanceTo(new Vector3(1, 1, 1))).toBeGreaterThan(0);
    });

    it('respects speed multiplier', () => {
      const sys1 = new LorenzSystem(new Vector3(1, 1, 1), { sigma: 10, rho: 28, beta: 8 / 3 });
      const sys2 = new LorenzSystem(new Vector3(1, 1, 1), { sigma: 10, rho: 28, beta: 8 / 3 });

      sys1.step(1.0);
      sys2.step(2.0);

      // Faster speed should move further from initial in one step
      const d1 = sys1.points[1].distanceTo(new Vector3(1, 1, 1));
      const d2 = sys2.points[1].distanceTo(new Vector3(1, 1, 1));
      expect(d2).toBeGreaterThan(d1);
    });
  });

  describe('stability guard', () => {
    it('resets to (1,1,1) if position diverges beyond 1e6', () => {
      // Use extreme parameters that cause divergence
      const unstable = new LorenzSystem(new Vector3(1e5, 1e5, 1e5), { sigma: 100, rho: 1000, beta: 100 });
      for (let i = 0; i < 100; i++) {
        unstable.step(5.0);
      }
      const last = unstable.points[unstable.points.length - 1];
      // Should have been reset rather than going to Infinity
      expect(Number.isFinite(last.x)).toBe(true);
    });
  });

  describe('Lyapunov exponent', () => {
    it('converges to a positive value for classic Lorenz (chaotic)', () => {
      for (let i = 0; i < 3000; i++) {
        system.step(1.0);
      }
      // Classic Lorenz should have λ ≈ 0.9 (positive = chaotic)
      expect(system.lyapunovExponent).toBeGreaterThan(0);
    });
  });

  describe('Poincaré section', () => {
    it('accumulates section points after sufficient steps', () => {
      for (let i = 0; i < 5000; i++) {
        system.step(1.0);
      }
      expect(system.poincarePoints.length).toBeGreaterThan(0);
    });

    it('respects max Poincaré point limit', () => {
      for (let i = 0; i < 50000; i++) {
        system.step(1.0);
      }
      expect(system.poincarePoints.length).toBeLessThanOrEqual(5000);
    });
  });

  describe('trimTrail()', () => {
    it('trims trail to specified length', () => {
      for (let i = 0; i < 100; i++) {
        system.step(1.0);
      }
      expect(system.points.length).toBe(101); // 1 initial + 100 steps
      system.trimTrail(50);
      expect(system.points.length).toBe(50);
    });

    it('keeps the most recent points', () => {
      for (let i = 0; i < 10; i++) {
        system.step(1.0);
      }
      const lastBefore = system.points[system.points.length - 1].clone();
      system.trimTrail(3);
      const lastAfter = system.points[system.points.length - 1];
      expect(lastAfter.x).toBe(lastBefore.x);
      expect(lastAfter.y).toBe(lastBefore.y);
      expect(lastAfter.z).toBe(lastBefore.z);
    });

    it('does nothing when trail is shorter than max', () => {
      system.step(1.0);
      system.trimTrail(100);
      expect(system.points.length).toBe(2);
    });
  });

  describe('getSpeed()', () => {
    it('returns 0 with fewer than 2 points', () => {
      expect(system.getSpeed()).toBe(0);
    });

    it('returns a positive value after stepping', () => {
      system.step(1.0);
      expect(system.getSpeed()).toBeGreaterThan(0);
    });
  });

  describe('reset()', () => {
    it('clears all accumulated state', () => {
      for (let i = 0; i < 500; i++) {
        system.step(1.0);
      }
      system.reset(new Vector3(2, 2, 2));
      expect(system.points).toHaveLength(1);
      expect(system.points[0].x).toBe(2);
      expect(system.lyapunovExponent).toBe(0);
      expect(system.poincarePoints).toHaveLength(0);
    });
  });

  describe('updateParams()', () => {
    it('merges partial params', () => {
      system.updateParams({ sigma: 15 });
      const params = system.getParams();
      expect(params.sigma).toBe(15);
      expect(params.rho).toBe(28); // unchanged
    });
  });

  describe('butterfly effect sensitivity', () => {
    it('nearly identical initial conditions diverge', () => {
      const sys1 = new LorenzSystem(new Vector3(1, 1, 1), { sigma: 10, rho: 28, beta: 8 / 3 });
      const sys2 = new LorenzSystem(new Vector3(1.000001, 1, 1), { sigma: 10, rho: 28, beta: 8 / 3 });

      for (let i = 0; i < 5000; i++) {
        sys1.step(1.0);
        sys2.step(1.0);
      }

      const p1 = sys1.points[sys1.points.length - 1];
      const p2 = sys2.points[sys2.points.length - 1];
      const divergence = p1.distanceTo(p2);
      // After enough steps, tiny initial difference should lead to large divergence
      expect(divergence).toBeGreaterThan(1);
    });
  });
});
