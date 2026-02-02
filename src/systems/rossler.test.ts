import { describe, it, expect, beforeEach } from 'vitest';
import { Vector3 } from 'three';
import { RosslerSystem } from './rossler';

describe('RosslerSystem', () => {
  let system: RosslerSystem;

  beforeEach(() => {
    system = new RosslerSystem(new Vector3(1, 1, 1), { a: 0.2, b: 0.2, c: 5.7 });
  });

  describe('initialization', () => {
    it('starts with a single point', () => {
      expect(system.points).toHaveLength(1);
    });

    it('clones the initial position', () => {
      const init = new Vector3(3, 4, 5);
      const sys = new RosslerSystem(init, { a: 0.2, b: 0.2, c: 5.7 });
      // Mutating the original should not affect the system
      init.set(0, 0, 0);
      expect(sys.points[0].x).toBe(3);
    });
  });

  describe('step()', () => {
    it('produces finite coordinates for standard parameters', () => {
      for (let i = 0; i < 2000; i++) {
        const pos = system.step(1.0);
        expect(Number.isFinite(pos.x)).toBe(true);
        expect(Number.isFinite(pos.y)).toBe(true);
        expect(Number.isFinite(pos.z)).toBe(true);
      }
    });

    it('stays bounded for classic Rössler attractor', () => {
      for (let i = 0; i < 5000; i++) {
        system.step(1.0);
      }
      const last = system.points[system.points.length - 1];
      expect(Math.abs(last.x)).toBeLessThan(50);
      expect(Math.abs(last.y)).toBeLessThan(50);
      expect(Math.abs(last.z)).toBeLessThan(50);
    });
  });

  describe('Lyapunov exponent', () => {
    it('converges to a positive value for chaotic parameters (c=5.7)', () => {
      for (let i = 0; i < 5000; i++) {
        system.step(1.0);
      }
      expect(system.lyapunovExponent).toBeGreaterThan(0);
    });
  });

  describe('Poincaré section', () => {
    it('collects y=0 crossing points', () => {
      for (let i = 0; i < 10000; i++) {
        system.step(1.0);
      }
      expect(system.poincarePoints.length).toBeGreaterThan(0);
    });
  });

  describe('trimTrail()', () => {
    it('trims to specified length keeping newest points', () => {
      for (let i = 0; i < 100; i++) {
        system.step(1.0);
      }
      const lastBefore = system.points[system.points.length - 1].clone();
      system.trimTrail(20);
      expect(system.points.length).toBe(20);
      const lastAfter = system.points[system.points.length - 1];
      expect(lastAfter.x).toBeCloseTo(lastBefore.x);
    });
  });

  describe('reset()', () => {
    it('clears all state and resets to new position', () => {
      for (let i = 0; i < 500; i++) {
        system.step(1.0);
      }
      system.reset(new Vector3(5, 5, 5));
      expect(system.points).toHaveLength(1);
      expect(system.points[0].x).toBe(5);
      expect(system.lyapunovExponent).toBe(0);
      expect(system.poincarePoints).toHaveLength(0);
    });
  });

  describe('parameter regime sensitivity', () => {
    it('period-doubling regime (c=3.5) produces near-periodic behavior', () => {
      const periodic = new RosslerSystem(new Vector3(1, 1, 1), { a: 0.2, b: 0.2, c: 3.5 });
      for (let i = 0; i < 5000; i++) {
        periodic.step(1.0);
      }
      // Non-chaotic: Lyapunov should be small or negative
      expect(periodic.lyapunovExponent).toBeLessThan(0.5);
    });
  });
});
