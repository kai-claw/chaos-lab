import { create } from 'zustand';

export type ChaosSystem = 'lorenz' | 'rossler' | 'doublePendulum';

export interface SystemPreset {
  name: string;
  description: string;
  params: Record<string, number>;
}

export interface AppState {
  // System selection
  currentSystem: ChaosSystem;
  setCurrentSystem: (system: ChaosSystem) => void;

  // Simulation state
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  
  speed: number;
  setSpeed: (speed: number) => void;
  
  trailLength: number;
  setTrailLength: (length: number) => void;

  // Side-by-side mode
  sideBySideMode: boolean;
  setSideBySideMode: (enabled: boolean) => void;

  // Lorenz parameters
  lorenzParams: {
    sigma: number;
    rho: number;
    beta: number;
  };
  setLorenzParams: (params: Partial<AppState['lorenzParams']>) => void;

  // Rössler parameters
  rosslerParams: {
    a: number;
    b: number;
    c: number;
  };
  setRosslerParams: (params: Partial<AppState['rosslerParams']>) => void;

  // Double pendulum parameters
  doublePendulumParams: {
    mass1: number;
    mass2: number;
    length1: number;
    length2: number;
    gravity: number;
    damping: number;
  };
  setDoublePendulumParams: (params: Partial<AppState['doublePendulumParams']>) => void;

  // Presets
  currentPreset: string | null;
  setCurrentPreset: (preset: string | null) => void;

  // UI state
  showInfoPanel: boolean;
  setShowInfoPanel: (show: boolean) => void;
  
  // Camera controls
  autoRotate: boolean;
  setAutoRotate: (rotate: boolean) => void;

  // Reset functionality
  resetSimulation: () => void;
}

export const useStore = create<AppState>((set) => ({
  // System selection
  currentSystem: 'lorenz',
  setCurrentSystem: (system) => set({ currentSystem: system }),

  // Simulation state
  isPlaying: true,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  
  speed: 1.0,
  setSpeed: (speed) => set({ speed }),
  
  trailLength: 1000,
  setTrailLength: (length) => set({ trailLength: length }),

  // Side-by-side mode
  sideBySideMode: false,
  setSideBySideMode: (enabled) => set({ sideBySideMode: enabled }),

  // Lorenz parameters (classic values)
  lorenzParams: {
    sigma: 10.0,
    rho: 28.0,
    beta: 8.0 / 3.0,
  },
  setLorenzParams: (params) => set((state) => ({
    lorenzParams: { ...state.lorenzParams, ...params }
  })),

  // Rössler parameters (classic values)
  rosslerParams: {
    a: 0.2,
    b: 0.2,
    c: 5.7,
  },
  setRosslerParams: (params) => set((state) => ({
    rosslerParams: { ...state.rosslerParams, ...params }
  })),

  // Double pendulum parameters
  doublePendulumParams: {
    mass1: 1.0,
    mass2: 1.0,
    length1: 1.0,
    length2: 1.0,
    gravity: 9.81,
    damping: 0.0,
  },
  setDoublePendulumParams: (params) => set((state) => ({
    doublePendulumParams: { ...state.doublePendulumParams, ...params }
  })),

  // Presets
  currentPreset: null,
  setCurrentPreset: (preset) => set({ currentPreset: preset }),

  // UI state
  showInfoPanel: true,
  setShowInfoPanel: (show) => set({ showInfoPanel: show }),
  
  // Camera controls
  autoRotate: false,
  setAutoRotate: (rotate) => set({ autoRotate: rotate }),

  // Reset functionality
  resetSimulation: () => {
    // This will be implemented to reset the simulation state
    // Each system component will listen to this and reset accordingly
    set({ isPlaying: false });
    setTimeout(() => set({ isPlaying: true }), 100);
  },
}));

// Predefined presets for different systems
export const PRESETS: Record<ChaosSystem, SystemPreset[]> = {
  lorenz: [
    {
      name: 'Classic Lorenz',
      description: 'The original butterfly attractor discovered by Edward Lorenz',
      params: { sigma: 10.0, rho: 28.0, beta: 8.0 / 3.0 },
    },
    {
      name: 'Edge of Chaos',
      description: 'Parameters at the edge between order and chaos',
      params: { sigma: 10.0, rho: 24.0, beta: 8.0 / 3.0 },
    },
    {
      name: 'Strange Attractor',
      description: 'Different parameter set creating unique patterns',
      params: { sigma: 12.0, rho: 30.0, beta: 2.5 },
    },
  ],
  rossler: [
    {
      name: 'Classic Rössler',
      description: 'The standard Rössler attractor parameters',
      params: { a: 0.2, b: 0.2, c: 5.7 },
    },
    {
      name: 'Spiral Focus',
      description: 'Creates tighter spiral patterns',
      params: { a: 0.1, b: 0.1, c: 4.0 },
    },
    {
      name: 'Period Doubling',
      description: 'Shows period-doubling route to chaos',
      params: { a: 0.15, b: 0.2, c: 10.0 },
    },
  ],
  doublePendulum: [
    {
      name: 'Equal Masses',
      description: 'Two pendulums with equal mass and length',
      params: { mass1: 1.0, mass2: 1.0, length1: 1.0, length2: 1.0, gravity: 9.81, damping: 0.0 },
    },
    {
      name: 'Heavy Bottom',
      description: 'Bottom pendulum twice as heavy',
      params: { mass1: 1.0, mass2: 2.0, length1: 1.0, length2: 1.0, gravity: 9.81, damping: 0.0 },
    },
    {
      name: 'With Damping',
      description: 'Small damping showing energy dissipation',
      params: { mass1: 1.0, mass2: 1.0, length1: 1.0, length2: 1.0, gravity: 9.81, damping: 0.05 },
    },
  ],
};