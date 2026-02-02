import { create } from 'zustand';
import type { AppState } from './types';
import { perturbActiveSystem, systemRef } from './systemRef';
import { captureGhost as captureGhostToStore, clearGhosts as clearGhostStore } from './ghostStore';
import { THEMES } from './themes';

// Re-export everything so existing imports `from '../store/useStore'` keep working
export type { ChaosSystem, ColorTheme, ThemeColors, SystemPreset, StoryPreset, AppState } from './types';
export { THEMES } from './themes';
export { PRESETS, STORY_PRESETS } from './presets';

/**
 * Central application store (Zustand).
 *
 * Contains all UI state, simulation parameters, and feature toggles.
 * Components subscribe to individual slices via selectors to minimise
 * unnecessary re-renders.
 */
export const useStore = create<AppState>((set) => ({
  currentSystem: 'lorenz',
  setCurrentSystem: (system) => set({ currentSystem: system }),

  isPlaying: true,
  setIsPlaying: (playing) => set({ isPlaying: playing }),

  speed: 1.0,
  setSpeed: (speed) => set({ speed }),

  trailLength: 2000,
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
    lorenzParams: { ...state.lorenzParams, ...params },
  })),

  rosslerParams: { a: 0.2, b: 0.2, c: 5.7 },
  setRosslerParams: (params) => set((state) => ({
    rosslerParams: { ...state.rosslerParams, ...params },
  })),

  doublePendulumParams: {
    mass1: 1.0, mass2: 1.0, length1: 1.0, length2: 1.0, gravity: 9.81, damping: 0.0,
  },
  setDoublePendulumParams: (params) => set((state) => ({
    doublePendulumParams: { ...state.doublePendulumParams, ...params },
  })),

  currentPreset: null,
  setCurrentPreset: (preset) => set({ currentPreset: preset }),

  showInfoPanel: true,
  setShowInfoPanel: (show) => set({ showInfoPanel: show }),

  autoRotate: true,
  setAutoRotate: (rotate) => set({ autoRotate: rotate }),

  _resetCounter: 0,
  resetSimulation: () => {
    set((s) => ({ _resetCounter: s._resetCounter + 1, isPlaying: false }));
    setTimeout(() => set({ isPlaying: true }), 100);
  },

  showPerformanceWarning: false,
  setShowPerformanceWarning: (show) => set({ showPerformanceWarning: show }),

  // Analysis tools
  showLyapunov: false,
  setShowLyapunov: (show) => set({ showLyapunov: show }),
  lyapunovExponent: 0,
  setLyapunovExponent: (le) => set({ lyapunovExponent: le }),

  showBifurcation: false,
  setShowBifurcation: (show) => set({ showBifurcation: show }),

  showPoincare: false,
  setShowPoincare: (show) => set({ showPoincare: show }),

  showParameterSpace: false,
  setShowParameterSpace: (show) => set({ showParameterSpace: show }),

  // Creative features
  cinematicCamera: false,
  setCinematicCamera: (enabled) => set({ cinematicCamera: enabled }),

  chaosAutopilot: false,
  setChaosAutopilot: (enabled) => set({ chaosAutopilot: enabled }),

  storyMode: false,
  setStoryMode: (active) => set({ storyMode: active }),
  currentStoryIndex: 0,
  setCurrentStoryIndex: (index) => set({ currentStoryIndex: index }),

  // Bloom post-processing
  bloomEnabled: true,
  setBloomEnabled: (enabled) => set({ bloomEnabled: enabled }),
  bloomIntensity: 1.5,
  setBloomIntensity: (intensity) => set({ bloomIntensity: intensity }),

  // Audio sonification
  audioEnabled: false,
  setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
  audioVolume: 0.3,
  setAudioVolume: (volume) => set({ audioVolume: volume }),

  // Particle Swarm
  particleSwarm: false,
  setParticleSwarm: (enabled) => set({ particleSwarm: enabled }),

  // Perturbation
  _perturbCounter: 0,
  perturbSystem: () => {
    perturbActiveSystem(1.0);
    set((s) => ({ _perturbCounter: s._perturbCounter + 1 }));
  },

  // Ghost trail capture
  _ghostVersion: 0,
  captureGhost: () => {
    const system = systemRef.system;
    const sysType = systemRef.type;
    if (!system?.points || system.points.length < 10 || !sysType) return;
    const state = useStore.getState();
    const hue = THEMES[state.colorTheme].trailHue1;
    captureGhostToStore(system.points, sysType, hue);
    set((s) => ({ _ghostVersion: s._ghostVersion + 1 }));
  },
  clearGhosts: () => {
    clearGhostStore();
    set((s) => ({ _ghostVersion: s._ghostVersion + 1 }));
  },

  // Floor shadow projection
  showFloorShadow: false,
  setShowFloorShadow: (show) => set({ showFloorShadow: show }),

  // Exposure mode
  exposureMode: false,
  setExposureMode: (enabled) => set({ exposureMode: enabled }),
  _exposureClearCounter: 0,
  clearExposure: () => set((s) => ({ _exposureClearCounter: s._exposureClearCounter + 1 })),
}));
