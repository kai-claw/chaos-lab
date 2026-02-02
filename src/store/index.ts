/**
 * Store barrel export.
 *
 * Prefer importing from here (`'../store'`) for new code.
 * Legacy imports from `'../store/useStore'` still work via re-exports there.
 */
export { useStore } from './useStore';
export { THEMES } from './themes';
export { PRESETS, STORY_PRESETS } from './presets';
export { systemRef, setActiveSystem, clearActiveSystem } from './systemRef';

export type {
  ChaosSystem,
  ColorTheme,
  ThemeColors,
  SystemPreset,
  StoryPreset,
  AppState,
  LorenzParamsState,
  RosslerParamsState,
  DoublePendulumParamsState,
} from './types';

export type { ChaosSystemRef, SystemType } from './systemRef';
