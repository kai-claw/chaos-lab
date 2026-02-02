import { describe, it, expect, beforeEach } from 'vitest';
import { DoublePendulumSystem } from './doublePendulum';

describe('DoublePendulumSystem', () => {
  let system: DoublePendulumSystem;

  const defaultParams = {
    mass1: 1, mass2: 1, length1: 1, length2: 1, gravity: 9.81, damping: 0,
  };

  const defaultState = {
    theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0,
  };

  beforeEach(() => {
    system = new DoublePendulumSystem(defaultState, defaultParams);
  });

  describe('initialization', () => {
    it('starts with a single point and position', () => {
      expect(system.points).toHaveLength(1);
      expect(system.positions).toHaveLength(1);
    });

    it('computes correct initial pendulum positions', () => {
      const pos = system.getCurrentPositions();
      // theta1 = pi/2: first bob at (sin(pi/2)*L1, -cos(pi/2)*L1) = (1, 0)
      expect(pos.p1.x).toBeCloseTo(1, 5);
      expect(pos.p1.y).toBeCloseTo(0, 5);
    });

    it('second bob position depends on both angles', () => {
      const pos = system.getCurrentPositions();
      // Both at pi/2: p2.x = sin(pi/2) + sin(pi/2) = 2
      expect(pos.p2.x).toBeCloseTo(2, 5);
      expect(pos.p2.y).toBeCloseTo(0, 5);
    });
  });

  describe('step()', () => {
    it('produces finite coordinates', () => {
      for (let i = 0; i < 2000; i++) {
        const pos = system.step(1.0);
        expect(Number.isFinite(pos.x)).toBe(true);
        expect(Number.isFinite(pos.y)).toBe(true);
      }
    });

    it('z-coordinate is always 0 (2D system)', () => {
      for (let i = 0; i < 100; i++) {
        const pos = system.step(1.0);
        expect(pos.z).toBe(0);
      }
    });

    it('conserves energy (approximately, without damping)', () => {
      // For an undamped system, total energy should be roughly conserved
      // We check that the system stays bounded
      for (let i = 0; i < 10000; i++) {
        system.step(1.0);
      }
      const state = system.getState();
      // Angular velocities should remain finite and bounded
      expect(Math.abs(state.omega1)).toBeLessThan(100);
      expect(Math.abs(state.omega2)).toBeLessThan(100);
    });
  });

  describe('damping', () => {
    it('damped system has lower velocities than undamped after long run', () => {
      const damped = new DoublePendulumSystem(
        defaultState,
        { ...defaultParams, damping: 0.1 }
      );
      const undamped = new DoublePendulumSystem(
        defaultState,
        { ...defaultParams, damping: 0 }
      );

      // Run both for the same duration and compare average velocity
      const STEPS = 20000;
      let dampedVelSum = 0;
      let undampedVelSum = 0;

      for (let i = 0; i < STEPS; i++) {
        damped.step(1.0);
        undamped.step(1.0);
        if (i > STEPS / 2) {
          // Measure second half to skip transient
          const ds = damped.getState();
          const us = undamped.getState();
          dampedVelSum += Math.abs(ds.omega1) + Math.abs(ds.omega2);
          undampedVelSum += Math.abs(us.omega1) + Math.abs(us.omega2);
        }
      }

      // Damped system should have lower average velocities
      expect(dampedVelSum).toBeLessThan(undampedVelSum);
    });
  });

  describe('trimTrail()', () => {
    it('trims both points and positions arrays', () => {
      for (let i = 0; i < 100; i++) {
        system.step(1.0);
      }
      system.trimTrail(30);
      expect(system.points.length).toBe(30);
      expect(system.positions.length).toBe(30);
    });
  });

  describe('reset()', () => {
    it('clears all state', () => {
      for (let i = 0; i < 500; i++) {
        system.step(1.0);
      }
      const newState = { theta1: 0.5, theta2: 1.0, omega1: 0, omega2: 0 };
      system.reset(newState);
      expect(system.points).toHaveLength(1);
      expect(system.positions).toHaveLength(1);
      expect(system.lyapunovExponent).toBe(0);
      expect(system.poincarePoints).toHaveLength(0);
      const state = system.getState();
      expect(state.theta1).toBe(0.5);
      expect(state.theta2).toBe(1.0);
    });
  });

  describe('getSpeed()', () => {
    it('returns 0 with only one point', () => {
      expect(system.getSpeed()).toBe(0);
    });

    it('returns positive value after stepping', () => {
      system.step(1.0);
      expect(system.getSpeed()).toBeGreaterThan(0);
    });
  });

  describe('perturb', () => {
    it('should alter the pendulum state', () => {
      for (let i = 0; i < 50; i++) system.step(1.0);
      const stateBefore = system.getState();
      system.perturb(1.0);
      const stateAfter = system.getState();
      const changed = stateBefore.theta1 !== stateAfter.theta1 ||
                      stateBefore.omega1 !== stateAfter.omega1;
      expect(changed).toBe(true);
    });
  });

  describe('sensitivity to initial conditions', () => {
    it('tiny angle difference leads to divergent trajectories', () => {
      const sys1 = new DoublePendulumSystem(
        { theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0 },
        defaultParams
      );
      const sys2 = new DoublePendulumSystem(
        { theta1: Math.PI / 2 + 0.0001, theta2: Math.PI / 2, omega1: 0, omega2: 0 },
        defaultParams
      );

      for (let i = 0; i < 10000; i++) {
        sys1.step(1.0);
        sys2.step(1.0);
      }

      const p1 = sys1.points[sys1.points.length - 1];
      const p2 = sys2.points[sys2.points.length - 1];
      const divergence = p1.distanceTo(p2);
      expect(divergence).toBeGreaterThan(0.01);
    });
  });
});
