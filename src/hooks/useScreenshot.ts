import { useCallback } from 'react';
import { useStore } from '../store/useStore';

/**
 * Hook to capture the Three.js canvas as a PNG screenshot.
 * Generates a smart filename: chaos-lab-{system}-{YYYY-MM-DD}.png
 */
export function useScreenshot() {
  const { currentSystem } = useStore();

  const takeScreenshot = useCallback(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    // Three.js doesn't preserve drawing buffer by default, so we
    // request a frame and capture immediately from the toDataURL.
    // Because we set `preserveDrawingBuffer` is not set, we'll
    // capture via toBlob which works in the current frame.
    try {
      const systemName = currentSystem === 'doublePendulum' ? 'pendulum' : currentSystem;
      const date = new Date().toISOString().split('T')[0];
      const filename = `chaos-lab-${systemName}-${date}.png`;

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (e) {
      console.warn('Screenshot failed:', e);
    }
  }, [currentSystem]);

  return takeScreenshot;
}
