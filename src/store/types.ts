/**
 * Core type definitions for Chaos Lab.
 * Kept separate from the store to avoid circular imports
 * and give a single source of truth for shared types.
 */

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

export interface SystemPreset {
  name: string;
  description: string;
  params: Record<string, number>;
}

export interface StoryPreset {
  name: string;
  emoji: string;
  description: string;
  system: ChaosSystem;
  params: Record<string, number>;
  trailLength: number;
  speed: number;
  sideBySide: boolean;
  offset: number;
}

export interface LorenzParamsState {
  sigma: number;
  rho: number;
  beta: number;
}

export interface RosslerParamsState {
  a: number;
  b: number;
  c: number;
}

export interface DoublePendulumParamsState {
  mass1: number;
  mass2: number;
  length1: number;
  length2: number;
  gravity: number;
  damping: number;
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

  initialOffset: number;
  setInitialOffset: (offset: number) => void;

  divergence: number;
  setDivergence: (d: number) => void;

  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;

  lorenzParams: LorenzParamsState;
  setLorenzParams: (params: Partial<LorenzParamsState>) => void;

  rosslerParams: RosslerParamsState;
  setRosslerParams: (params: Partial<RosslerParamsState>) => void;

  doublePendulumParams: DoublePendulumParamsState;
  setDoublePendulumParams: (params: Partial<DoublePendulumParamsState>) => void;

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

  // Analysis tools
  showLyapunov: boolean;
  setShowLyapunov: (show: boolean) => void;
  lyapunovExponent: number;
  setLyapunovExponent: (le: number) => void;

  showBifurcation: boolean;
  setShowBifurcation: (show: boolean) => void;

  showPoincare: boolean;
  setShowPoincare: (show: boolean) => void;

  showParameterSpace: boolean;
  setShowParameterSpace: (show: boolean) => void;

  // Creative features
  cinematicCamera: boolean;
  setCinematicCamera: (enabled: boolean) => void;

  chaosAutopilot: boolean;
  setChaosAutopilot: (enabled: boolean) => void;

  storyMode: boolean;
  setStoryMode: (active: boolean) => void;
  currentStoryIndex: number;
  setCurrentStoryIndex: (index: number) => void;

  // Bloom post-processing
  bloomEnabled: boolean;
  setBloomEnabled: (enabled: boolean) => void;
  bloomIntensity: number;
  setBloomIntensity: (intensity: number) => void;

  // Audio sonification
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  audioVolume: number;
  setAudioVolume: (volume: number) => void;

  // Particle Swarm
  particleSwarm: boolean;
  setParticleSwarm: (enabled: boolean) => void;

  // Perturbation
  _perturbCounter: number;
  perturbSystem: () => void;

  // Ghost trail capture
  _ghostVersion: number;
  captureGhost: () => void;
  clearGhosts: () => void;

  // Floor shadow projection
  showFloorShadow: boolean;
  setShowFloorShadow: (show: boolean) => void;

  // Exposure mode (long-exposure point cloud)
  exposureMode: boolean;
  setExposureMode: (enabled: boolean) => void;
  _exposureClearCounter: number;
  clearExposure: () => void;
}
