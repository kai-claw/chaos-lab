import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, THEMES } from '../store/useStore';
import { systemRef } from '../store/systemRef';

/**
 * Floor Shadow — a 2D projection of the attractor onto a plane below.
 *
 * Like a shadow cast by a 3D sculpture onto a table, this shows the
 * attractor's X–Y footprint as a dim, ghostly line on a plane beneath
 * the 3D visualization. The effect is both beautiful and educational:
 * it reveals how the 3D attractor looks "from above" in real time.
 *
 * For the double pendulum (already 2D), this component is hidden.
 * For Lorenz and Rössler, the shadow projects onto y = shadowY,
 * collapsing the vertical dimension.
 */

const MAX_SHADOW_POINTS = 4000;

const SCALE_MAP: Record<string, number> = {
  lorenz: 0.1,
  rossler: 0.5,
  doublePendulum: 1.0,
};

/** Shadow plane Y position (below the attractor) */
const SHADOW_Y: Record<string, number> = {
  lorenz: -0.5,   // Lorenz: trail is roughly y ∈ [-3, 3] scaled, shadow below
  rossler: -6,     // Rössler: can spike in z, so shadow goes lower
};

export const FloorShadow: React.FC = () => {
  const { showFloorShadow, currentSystem, colorTheme } = useStore();
  const theme = THEMES[colorTheme];
  const geoRef = useRef<THREE.BufferGeometry>(null);

  // Pre-allocated buffers
  const buffers = useMemo(() => ({
    positions: new Float32Array(MAX_SHADOW_POINTS * 3),
    colors: new Float32Array(MAX_SHADOW_POINTS * 3),
  }), []);

  // Cached shadow color from theme
  const shadowColor = useMemo(() => {
    const c = new THREE.Color(theme.accent);
    // Desaturate and dim for shadow appearance
    return {
      r: c.r * 0.3,
      g: c.g * 0.3,
      b: c.b * 0.3,
    };
  }, [theme.accent]);

  // Initialize geometry attributes
  useMemo(() => {
    // Will be set up on first frame
  }, []);

  useFrame(() => {
    if (!showFloorShadow || !geoRef.current) return;
    if (currentSystem === 'doublePendulum') {
      geoRef.current.setDrawRange(0, 0);
      return;
    }

    const system = systemRef.system;
    if (!system?.points || system.points.length < 2) {
      geoRef.current.setDrawRange(0, 0);
      return;
    }

    const pts = system.points;
    const scale = SCALE_MAP[currentSystem] ?? 0.1;
    const shadowY = SHADOW_Y[currentSystem] ?? -3;
    const len = Math.min(pts.length, MAX_SHADOW_POINTS);
    const startIdx = Math.max(0, pts.length - MAX_SHADOW_POINTS);

    const { positions, colors } = buffers;

    for (let i = 0; i < len; i++) {
      const p = pts[startIdx + i];
      const i3 = i * 3;

      // Project: X stays, Y becomes the shadow plane, Z maps to the scene Y axis
      // For Lorenz: shadow shows the XZ footprint on the floor
      positions[i3] = p.x * scale;
      positions[i3 + 1] = shadowY;
      positions[i3 + 2] = p.z * scale;

      // Fade from tail to head
      const t = len > 1 ? i / (len - 1) : 1;
      const alpha = t * t * 0.6; // quadratic fade, max 60% brightness

      colors[i3] = shadowColor.r * alpha;
      colors[i3 + 1] = shadowColor.g * alpha;
      colors[i3 + 2] = shadowColor.b * alpha;
    }

    // Update geometry
    let posAttr = geoRef.current.getAttribute('position') as THREE.BufferAttribute | null;
    let colAttr = geoRef.current.getAttribute('color') as THREE.BufferAttribute | null;

    if (!posAttr) {
      posAttr = new THREE.BufferAttribute(new Float32Array(MAX_SHADOW_POINTS * 3), 3);
      geoRef.current.setAttribute('position', posAttr);
    }
    if (!colAttr) {
      colAttr = new THREE.BufferAttribute(new Float32Array(MAX_SHADOW_POINTS * 3), 3);
      geoRef.current.setAttribute('color', colAttr);
    }

    (posAttr.array as Float32Array).set(positions.subarray(0, len * 3));
    (colAttr.array as Float32Array).set(colors.subarray(0, len * 3));
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    geoRef.current.setDrawRange(0, len);
  });

  if (!showFloorShadow || currentSystem === 'doublePendulum') return null;

  return (
    <primitive object={new THREE.Line()}>
      <bufferGeometry ref={geoRef} />
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </primitive>
  );
};
