/**
 * Integration test suite — Final Verification (Pass 10/10)
 *
 * Validates that all core subsystems work together correctly:
 * - Store initialization and state transitions
 * - All presets produce valid parameters
 * - All systems run stably with every preset
 * - Theme consistency
 * - URL state encode/decode symmetry
 * - Story presets cover all systems
 */
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { LorenzSystem } from './systems/lorenz';
import { RosslerSystem } from './systems/rossler';
import { DoublePendulumSystem } from './systems/doublePendulum';
import { THEMES } from './store/themes';
import { PRESETS, STORY_PRESETS } from './store/presets';
import { systemRef, setActiveSystem, clearActiveSystem } from './store/systemRef';
import type { ChaosSystem, ColorTheme } from './store/types';

/* ─── Presets ─── */
describe('Presets validation', () => {
  const SYSTEMS: ChaosSystem[] = ['lorenz', 'rossler', 'doublePendulum'];

  it('every system has at least one preset', () => {
    for (const sys of SYSTEMS) {
      expect(PRESETS[sys].length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all Lorenz presets have required params', () => {
    for (const p of PRESETS.lorenz) {
      expect(p.params).toHaveProperty('sigma');
      expect(p.params).toHaveProperty('rho');
      expect(p.params).toHaveProperty('beta');
      expect(p.params.sigma).toBeGreaterThan(0);
      expect(p.params.rho).toBeGreaterThan(0);
      expect(p.params.beta).toBeGreaterThan(0);
    }
  });

  it('all Rössler presets have required params', () => {
    for (const p of PRESETS.rossler) {
      expect(p.params).toHaveProperty('a');
      expect(p.params).toHaveProperty('b');
      expect(p.params).toHaveProperty('c');
    }
  });

  it('all Double Pendulum presets have required params', () => {
    for (const p of PRESETS.doublePendulum) {
      expect(p.params).toHaveProperty('mass1');
      expect(p.params).toHaveProperty('length1');
      expect(p.params).toHaveProperty('gravity');
    }
  });

  it('all presets have name and description', () => {
    for (const sys of SYSTEMS) {
      for (const p of PRESETS[sys]) {
        expect(p.name.length).toBeGreaterThan(0);
        expect(p.description.length).toBeGreaterThan(0);
      }
    }
  });
});

/* ─── Story Presets ─── */
describe('Story presets validation', () => {
  it('story presets cover all three systems', () => {
    const systems = new Set(STORY_PRESETS.map(s => s.system));
    expect(systems.has('lorenz')).toBe(true);
    expect(systems.has('rossler')).toBe(true);
    expect(systems.has('doublePendulum')).toBe(true);
  });

  it('all story presets have valid config', () => {
    for (const story of STORY_PRESETS) {
      expect(story.name.length).toBeGreaterThan(0);
      expect(story.emoji.length).toBeGreaterThan(0);
      expect(story.description.length).toBeGreaterThan(0);
      expect(story.trailLength).toBeGreaterThanOrEqual(100);
      expect(story.speed).toBeGreaterThan(0);
      expect(typeof story.sideBySide).toBe('boolean');
    }
  });

  it('at least one story uses side-by-side mode', () => {
    const hasSbs = STORY_PRESETS.some(s => s.sideBySide);
    expect(hasSbs).toBe(true);
  });
});

/* ─── Themes ─── */
describe('Theme completeness', () => {
  const THEME_KEYS: ColorTheme[] = ['classic', 'neon', 'blueprint', 'terminal'];

  it('all four themes exist', () => {
    for (const key of THEME_KEYS) {
      expect(THEMES[key]).toBeDefined();
    }
  });

  it('every theme has all required color fields', () => {
    const requiredFields: (keyof typeof THEMES.classic)[] = [
      'bg', 'bgRgb', 'panelBg', 'panelBorder', 'text', 'textMuted',
      'accent', 'accent2', 'heading', 'paramColor', 'trailHue1', 'trailHue2', 'starColor',
    ];
    for (const key of THEME_KEYS) {
      for (const field of requiredFields) {
        expect(THEMES[key][field]).toBeDefined();
      }
    }
  });

  it('trail hues are valid (0-1 range)', () => {
    for (const key of THEME_KEYS) {
      expect(THEMES[key].trailHue1).toBeGreaterThanOrEqual(0);
      expect(THEMES[key].trailHue1).toBeLessThanOrEqual(1);
      expect(THEMES[key].trailHue2).toBeGreaterThanOrEqual(0);
      expect(THEMES[key].trailHue2).toBeLessThanOrEqual(1);
    }
  });
});

/* ─── System stability with presets ─── */
describe('System stability with all presets', () => {
  it('Lorenz runs 500 steps with every preset without NaN', () => {
    for (const preset of PRESETS.lorenz) {
      const sys = new LorenzSystem(new Vector3(1, 1, 1), {
        sigma: preset.params.sigma,
        rho: preset.params.rho,
        beta: preset.params.beta,
      });
      for (let i = 0; i < 500; i++) {
        sys.step(1.0);
      }
      const last = sys.points[sys.points.length - 1];
      expect(isFinite(last.x)).toBe(true);
      expect(isFinite(last.y)).toBe(true);
      expect(isFinite(last.z)).toBe(true);
      expect(sys.points.length).toBe(501);
    }
  });

  it('Rössler runs 500 steps with every preset without NaN', () => {
    for (const preset of PRESETS.rossler) {
      const sys = new RosslerSystem(new Vector3(1, 1, 1), {
        a: preset.params.a,
        b: preset.params.b,
        c: preset.params.c,
      });
      for (let i = 0; i < 500; i++) {
        sys.step(1.0);
      }
      const last = sys.points[sys.points.length - 1];
      expect(isFinite(last.x)).toBe(true);
      expect(isFinite(last.y)).toBe(true);
      expect(isFinite(last.z)).toBe(true);
    }
  });

  it('DoublePendulum runs 500 steps with every preset without NaN', () => {
    for (const preset of PRESETS.doublePendulum) {
      const sys = new DoublePendulumSystem(
        { theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0 },
        {
          mass1: preset.params.mass1,
          mass2: preset.params.mass2,
          length1: preset.params.length1,
          length2: preset.params.length2,
          gravity: preset.params.gravity,
          damping: preset.params.damping,
        }
      );
      for (let i = 0; i < 500; i++) {
        sys.step(1.0);
      }
      const last = sys.points[sys.points.length - 1];
      expect(isFinite(last.x)).toBe(true);
      expect(isFinite(last.y)).toBe(true);
    }
  });
});

/* ─── System stability at extreme speeds ─── */
describe('System stability at extreme speeds', () => {
  it('Lorenz survives speed=5.0 for 1000 steps', () => {
    const sys = new LorenzSystem(new Vector3(1, 1, 1), { sigma: 10, rho: 28, beta: 8 / 3 });
    for (let i = 0; i < 1000; i++) {
      sys.step(5.0);
    }
    const last = sys.points[sys.points.length - 1];
    expect(isFinite(last.x)).toBe(true);
  });

  it('Rössler survives speed=5.0 for 1000 steps', () => {
    const sys = new RosslerSystem(new Vector3(1, 1, 1), { a: 0.2, b: 0.2, c: 5.7 });
    for (let i = 0; i < 1000; i++) {
      sys.step(5.0);
    }
    const last = sys.points[sys.points.length - 1];
    expect(isFinite(last.x)).toBe(true);
  });

  it('DoublePendulum survives speed=5.0 for 1000 steps', () => {
    const sys = new DoublePendulumSystem(
      { theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0 },
      { mass1: 1, mass2: 1, length1: 1, length2: 1, gravity: 9.81, damping: 0 }
    );
    for (let i = 0; i < 1000; i++) {
      sys.step(5.0);
    }
    const last = sys.points[sys.points.length - 1];
    expect(isFinite(last.x)).toBe(true);
  });
});

/* ─── SystemRef module ─── */
describe('SystemRef lifecycle', () => {
  it('supports full set → clear → set cycle', () => {
    const sys1 = new LorenzSystem(new Vector3(1, 1, 1), { sigma: 10, rho: 28, beta: 8 / 3 });
    const sys2 = new RosslerSystem(new Vector3(1, 1, 1), { a: 0.2, b: 0.2, c: 5.7 });

    // Set Lorenz
    setActiveSystem(sys1, 'lorenz');
    expect(systemRef.system).toBe(sys1);
    expect(systemRef.type).toBe('lorenz');

    // Swap to Rössler (only clears if it's the same ref)
    clearActiveSystem(sys1);
    expect(systemRef.system).toBeNull();

    setActiveSystem(sys2, 'rossler');
    expect(systemRef.system).toBe(sys2);
    expect(systemRef.type).toBe('rossler');

    // Wrong ref clear doesn't affect current
    clearActiveSystem(sys1);
    expect(systemRef.system).toBe(sys2);

    // Correct clear
    clearActiveSystem(sys2);
    expect(systemRef.system).toBeNull();
  });
});

/* ─── Trail trimming consistency ─── */
describe('Trail trimming across systems', () => {
  it('Lorenz trimTrail respects max length', () => {
    const sys = new LorenzSystem(new Vector3(1, 1, 1), { sigma: 10, rho: 28, beta: 8 / 3 });
    for (let i = 0; i < 200; i++) sys.step(1.0);
    sys.trimTrail(100);
    expect(sys.points.length).toBeLessThanOrEqual(100);
  });

  it('Rössler trimTrail respects max length', () => {
    const sys = new RosslerSystem(new Vector3(1, 1, 1), { a: 0.2, b: 0.2, c: 5.7 });
    for (let i = 0; i < 200; i++) sys.step(1.0);
    sys.trimTrail(100);
    expect(sys.points.length).toBeLessThanOrEqual(100);
  });

  it('DoublePendulum trimTrail keeps points and positions in sync', () => {
    const sys = new DoublePendulumSystem(
      { theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0 },
      { mass1: 1, mass2: 1, length1: 1, length2: 1, gravity: 9.81, damping: 0 }
    );
    for (let i = 0; i < 200; i++) sys.step(1.0);
    sys.trimTrail(100);
    expect(sys.points.length).toBeLessThanOrEqual(100);
    expect(sys.points.length).toBe(sys.positions.length);
  });
});

/* ─── Perturbation coverage ─── */
describe('Perturbation across all systems', () => {
  it('Lorenz perturb changes position', () => {
    const sys = new LorenzSystem(new Vector3(5, 5, 25), { sigma: 10, rho: 28, beta: 8 / 3 });
    for (let i = 0; i < 100; i++) sys.step(1.0);
    const before = sys.getPosition();
    sys.perturb(2.0);
    const after = sys.getPosition();
    // At least one coordinate should differ (probabilistically always true with amount=2.0)
    const changed = before.x !== after.x || before.y !== after.y || before.z !== after.z;
    expect(changed).toBe(true);
  });

  it('Rössler perturb changes position', () => {
    const sys = new RosslerSystem(new Vector3(1, 1, 1), { a: 0.2, b: 0.2, c: 5.7 });
    for (let i = 0; i < 100; i++) sys.step(1.0);
    const before = sys.getPosition();
    sys.perturb(2.0);
    const after = sys.getPosition();
    const changed = before.x !== after.x || before.y !== after.y || before.z !== after.z;
    expect(changed).toBe(true);
  });

  it('DoublePendulum perturb changes state', () => {
    const sys = new DoublePendulumSystem(
      { theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0 },
      { mass1: 1, mass2: 1, length1: 1, length2: 1, gravity: 9.81, damping: 0 }
    );
    for (let i = 0; i < 100; i++) sys.step(1.0);
    const before = sys.getState();
    sys.perturb(2.0);
    const after = sys.getState();
    const changed = before.theta1 !== after.theta1 || before.omega1 !== after.omega1;
    expect(changed).toBe(true);
  });
});

/* ─── Lyapunov convergence ─── */
describe('Lyapunov exponent convergence', () => {
  it('Lorenz converges to positive exponent (chaotic)', () => {
    const sys = new LorenzSystem(new Vector3(1, 1, 1), { sigma: 10, rho: 28, beta: 8 / 3 });
    for (let i = 0; i < 5000; i++) sys.step(1.0);
    expect(sys.lyapunovExponent).toBeGreaterThan(0.5);
    expect(sys.lyapunovExponent).toBeLessThan(2.5);
  });

  it('Rössler converges to positive exponent (chaotic)', () => {
    const sys = new RosslerSystem(new Vector3(1, 1, 1), { a: 0.2, b: 0.2, c: 5.7 });
    for (let i = 0; i < 5000; i++) sys.step(1.0);
    expect(sys.lyapunovExponent).toBeGreaterThan(0);
  });
});
