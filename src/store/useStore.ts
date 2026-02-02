import { create } from 'zustand';

export type ChaosSystem = 'lorenz' | 'rossler' | 'doublePendulum';
export type ColorTheme = 'classic' | 'neon' | 'blueprint' | 'terminal';

export interface ThemeColors {
  bg: string;
  bgRgb: string;
  panelBg: string;
  panelBorder: string;
  text: string;
  textMuted: string;
  accent: string;
  accent2: string;
  heading: string;
  paramColor: string;
  trailHue1: number;
  trailHue2: number;
  starColor: string;
}

export const THEMES: Record<ColorTheme, ThemeColors> = {
  classic: {
    bg: '#000010',
    bgRgb: '0,0,16',
    panelBg: 'rgba(20, 20, 25, 0.95)',
    panelBorder: 'rgba(255, 255, 255, 0.1)',
    text: '#cccccc',
    textMuted: 'rgba(255,255,255,0.6)',
    accent: '#88ccff',
    accent2: '#aaffaa',
    heading: '#88ccff',
    paramColor: '#ffcc88',
    trailHue1: 0.55,
    trailHue2: 0.85,
    starColor: '#ffffff',
  },
  neon: {
    bg: '#000000',
    bgRgb: '0,0,0',
    panelBg: 'rgba(10, 0, 20, 0.95)',
    panelBorder: 'rgba(255, 0, 255, 0.25)',
    text: '#e0e0e0',
    textMuted: 'rgba(255,255,255,0.5)',
    accent: '#ff00ff',
    accent2: '#00ffff',
    heading: '#ff44ff',
    paramColor: '#ffff00',
    trailHue1: 0.83,
    trailHue2: 0.5,
    starColor: '#ff88ff',
  },
  blueprint: {
    bg: '#0a1628',
    bgRgb: '10,22,40',
    panelBg: 'rgba(15, 30, 60, 0.95)',
    panelBorder: 'rgba(100, 160, 255, 0.3)',
    text: '#c0d8f0',
    textMuted: 'rgba(192,216,240,0.6)',
    accent: '#4488ff',
    accent2: '#88bbff',
    heading: '#6699ff',
    paramColor: '#aaccff',
    trailHue1: 0.6,
    trailHue2: 0.58,
    starColor: '#4488ff',
  },
  terminal: {
    bg: '#000a00',
    bgRgb: '0,10,0',
    panelBg: 'rgba(0, 15, 0, 0.95)',
    panelBorder: 'rgba(0, 255, 0, 0.2)',
    text: '#00dd00',
    textMuted: 'rgba(0,220,0,0.5)',
    accent: '#00ff00',
    accent2: '#88ff88',
    heading: '#00ff00',
    paramColor: '#44ff44',
    trailHue1: 0.33,
    trailHue2: 0.28,
    starColor: '#00ff00',
  },
};

export interface SystemPreset {
  name: string;
  description: string;
  params: Record<string, number>;
}

export interface AppState {
  currentSystem: ChaosSystem;
  setCurrentSystem: (system: ChaosSystem) => void;

  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  
  speed: number;
  setSpeed: (speed: number) => void;
  
  trailLength: number;
  setTrailLength: (length: number) => void;

  sideBySideMode: boolean;
  setSideBySideMode: (enabled: boolean) => void;

  // Butterfly effect initial offset (log10 scale)
  initialOffset: number;
  setInitialOffset: (offset: number) => void;

  // Divergence tracking
  divergence: number;
  setDivergence: (d: number) => void;

  // Color theme
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;

  lorenzParams: { sigma: number; rho: number; beta: number };
  setLorenzParams: (params: Partial<AppState['lorenzParams']>) => void;

  rosslerParams: { a: number; b: number; c: number };
  setRosslerParams: (params: Partial<AppState['rosslerParams']>) => void;

  doublePendulumParams: {
    mass1: number; mass2: number; length1: number; length2: number;
    gravity: number; damping: number;
  };
  setDoublePendulumParams: (params: Partial<AppState['doublePendulumParams']>) => void;

  currentPreset: string | null;
  setCurrentPreset: (preset: string | null) => void;

  showInfoPanel: boolean;
  setShowInfoPanel: (show: boolean) => void;
  
  autoRotate: boolean;
  setAutoRotate: (rotate: boolean) => void;

  resetSimulation: () => void;
  _resetCounter: number;
  
  showPerformanceWarning: boolean;
  setShowPerformanceWarning: (show: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  currentSystem: 'lorenz',
  setCurrentSystem: (system) => set({ currentSystem: system }),

  isPlaying: true,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  
  speed: 1.0,
  setSpeed: (speed) => set({ speed }),
  
  trailLength: 1000,
  setTrailLength: (length) => set({ trailLength: length }),

  sideBySideMode: false,
  setSideBySideMode: (enabled) => set({ sideBySideMode: enabled }),

  initialOffset: 0.001,
  setInitialOffset: (offset) => set({ initialOffset: offset }),

  divergence: 0,
  setDivergence: (d) => set({ divergence: d }),

  colorTheme: 'classic',
  setColorTheme: (theme) => set({ colorTheme: theme }),

  lorenzParams: { sigma: 10.0, rho: 28.0, beta: 8.0 / 3.0 },
  setLorenzParams: (params) => set((state) => ({
    lorenzParams: { ...state.lorenzParams, ...params }
  })),

  rosslerParams: { a: 0.2, b: 0.2, c: 5.7 },
  setRosslerParams: (params) => set((state) => ({
    rosslerParams: { ...state.rosslerParams, ...params }
  })),

  doublePendulumParams: {
    mass1: 1.0, mass2: 1.0, length1: 1.0, length2: 1.0, gravity: 9.81, damping: 0.0,
  },
  setDoublePendulumParams: (params) => set((state) => ({
    doublePendulumParams: { ...state.doublePendulumParams, ...params }
  })),

  currentPreset: null,
  setCurrentPreset: (preset) => set({ currentPreset: preset }),

  showInfoPanel: true,
  setShowInfoPanel: (show) => set({ showInfoPanel: show }),
  
  autoRotate: false,
  setAutoRotate: (rotate) => set({ autoRotate: rotate }),

  _resetCounter: 0,
  resetSimulation: () => {
    set((s) => ({ _resetCounter: s._resetCounter + 1, isPlaying: false }));
    setTimeout(() => set({ isPlaying: true }), 100);
  },
  
  showPerformanceWarning: false,
  setShowPerformanceWarning: (show) => set({ showPerformanceWarning: show }),
}));

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
