import type { ColorTheme, ThemeColors } from './types';

/**
 * Color theme definitions for Chaos Lab.
 * Each theme provides a complete set of coordinated colors
 * for the 3D scene, UI panels, trails, and starfield.
 */
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
