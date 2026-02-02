import type { ChaosSystem, SystemPreset, StoryPreset } from './types';

/**
 * Parameter presets for each chaos system.
 * Each preset provides a known-interesting configuration with
 * distinct visual behavior worth exploring.
 */
export const PRESETS: Record<ChaosSystem, SystemPreset[]> = {
  lorenz: [
    { name: 'Classic Lorenz', description: 'The original butterfly attractor', params: { sigma: 10.0, rho: 28.0, beta: 8.0 / 3.0 } },
    { name: 'Edge of Chaos', description: 'Parameters at the edge between order and chaos', params: { sigma: 10.0, rho: 24.0, beta: 8.0 / 3.0 } },
    { name: 'Strange Attractor', description: 'Different parameter set creating unique patterns', params: { sigma: 12.0, rho: 30.0, beta: 2.5 } },
  ],
  rossler: [
    { name: 'Classic Rössler', description: 'The standard Rössler attractor parameters', params: { a: 0.2, b: 0.2, c: 5.7 } },
    { name: 'Spiral Focus', description: 'Creates tighter spiral patterns', params: { a: 0.1, b: 0.1, c: 4.0 } },
    { name: 'Period Doubling', description: 'Shows period-doubling route to chaos', params: { a: 0.15, b: 0.2, c: 10.0 } },
  ],
  doublePendulum: [
    { name: 'Equal Masses', description: 'Two pendulums with equal mass and length', params: { mass1: 1.0, mass2: 1.0, length1: 1.0, length2: 1.0, gravity: 9.81, damping: 0.0 } },
    { name: 'Heavy Bottom', description: 'Bottom pendulum twice as heavy', params: { mass1: 1.0, mass2: 2.0, length1: 1.0, length2: 1.0, gravity: 9.81, damping: 0.0 } },
    { name: 'With Damping', description: 'Small damping showing energy dissipation', params: { mass1: 1.0, mass2: 1.0, length1: 1.0, length2: 1.0, gravity: 9.81, damping: 0.05 } },
  ],
};

/**
 * Story Mode presets — curated scenarios for guided cinematic tours.
 * Each story showcases a specific chaos theory concept with optimal
 * parameters, camera settings, and narrative description.
 */
export const STORY_PRESETS: StoryPreset[] = [
  {
    name: 'The Butterfly Effect',
    emoji: '🦋',
    description: 'Two nearly identical universes diverge into completely different futures',
    system: 'lorenz',
    params: { sigma: 10, rho: 28, beta: 8 / 3 },
    trailLength: 2000,
    speed: 1.0,
    sideBySide: true,
    offset: 0.000001,
  },
  {
    name: 'The Strange Attractor',
    emoji: '🌀',
    description: 'The iconic Lorenz butterfly — a shape that never repeats, yet never escapes',
    system: 'lorenz',
    params: { sigma: 10, rho: 28, beta: 8 / 3 },
    trailLength: 4000,
    speed: 1.5,
    sideBySide: false,
    offset: 0.001,
  },
  {
    name: 'Edge of Order',
    emoji: '⚖️',
    description: 'Right at the boundary where predictable behavior gives way to chaos',
    system: 'lorenz',
    params: { sigma: 10, rho: 24.5, beta: 8 / 3 },
    trailLength: 3000,
    speed: 0.8,
    sideBySide: false,
    offset: 0.001,
  },
  {
    name: 'The Spiral',
    emoji: '🌊',
    description: 'The Rössler attractor — simplicity breeds complexity in this elegant spiral',
    system: 'rossler',
    params: { a: 0.2, b: 0.2, c: 5.7 },
    trailLength: 3500,
    speed: 1.2,
    sideBySide: false,
    offset: 0.001,
  },
  {
    name: 'Period Doubling',
    emoji: '🔄',
    description: 'Watch the Rössler system trace a period-2 orbit — the route to chaos begins',
    system: 'rossler',
    params: { a: 0.2, b: 0.2, c: 3.5 },
    trailLength: 3000,
    speed: 1.0,
    sideBySide: false,
    offset: 0.001,
  },
  {
    name: 'The Pendulum',
    emoji: '⚡',
    description: 'A simple double pendulum — deterministic laws, unpredictable motion',
    system: 'doublePendulum',
    params: { mass1: 1, mass2: 1, length1: 1, length2: 1, gravity: 9.81, damping: 0 },
    trailLength: 2000,
    speed: 1.0,
    sideBySide: false,
    offset: 0.001,
  },
  {
    name: 'Dual Pendulums',
    emoji: '🔀',
    description: 'Two pendulums, almost identical — watch them dance apart',
    system: 'doublePendulum',
    params: { mass1: 1, mass2: 1, length1: 1, length2: 1, gravity: 9.81, damping: 0 },
    trailLength: 1500,
    speed: 1.0,
    sideBySide: true,
    offset: 0.0001,
  },
  {
    name: 'The Murmuration',
    emoji: '🐦',
    description: 'A swarm of particles traces the attractor — chaos as collective motion',
    system: 'lorenz',
    params: { sigma: 10, rho: 28, beta: 8 / 3 },
    trailLength: 1500,
    speed: 1.2,
    sideBySide: false,
    offset: 0.001,
  },
];
