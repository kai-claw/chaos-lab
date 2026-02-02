import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { getGhosts, type GhostTrail } from '../store/ghostStore';

/**
 * Ghost Trails — frozen snapshots of previous attractor trajectories.
 *
 * When the user captures a ghost (F key), the current trail is frozen
 * as a dim, translucent hologram. Multiple ghosts can be layered to
 * reveal how the attractor fills space over time — like overlapping
 * long-exposure photographs of chaos.
 *
 * Each ghost is rendered as a static line with faded, desaturated colors.
 * Up to 5 ghosts can coexist before the oldest is recycled.
 */

const MAX_GHOST_POINTS = 6000;

/** Single frozen ghost trail line renderer */
const GhostLine: React.FC<{ ghost: GhostTrail; index: number; total: number }> = ({
  ghost,
  index,
  total,
}) => {
  const geoRef = useRef<THREE.BufferGeometry>(null);

  useEffect(() => {
    if (!geoRef.current) return;

    const positions = new Float32Array(MAX_GHOST_POINTS * 3);
    const colors = new Float32Array(MAX_GHOST_POINTS * 3);

    // Copy ghost position data
    positions.set(ghost.positions.subarray(0, ghost.count * 3));

    // Ghost colors: same hue but dimmed, with spatial fade
    // Older ghosts are dimmer; newer ones are slightly brighter
    const ageFactor = 0.3 + ((index + 1) / total) * 0.4; // 0.3..0.7
    const c = new THREE.Color();

    for (let i = 0; i < ghost.count; i++) {
      const t = ghost.count > 1 ? i / (ghost.count - 1) : 1;
      const alpha = t * t * ageFactor; // quadratic fade from tail → head
      const hue = (ghost.hue + t * 0.08) % 1;

      c.setHSL(hue, 0.4, 0.15 + alpha * 0.25);

      const i3 = i * 3;
      colors[i3] = c.r * alpha;
      colors[i3 + 1] = c.g * alpha;
      colors[i3 + 2] = c.b * alpha;
    }

    geoRef.current.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3),
    );
    geoRef.current.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3),
    );
    geoRef.current.setDrawRange(0, ghost.count);
  }, [ghost, index, total]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  return (
    <primitive object={new THREE.Line()}>
      <bufferGeometry ref={geoRef} />
      <primitive object={material} attach="material" />
    </primitive>
  );
};

export const GhostTrails: React.FC = () => {
  // Subscribe to ghost version so we re-render when ghosts change
  const ghostVersion = useStore((s) => s._ghostVersion);

  // Read the module-level ghost data
  const ghosts = getGhosts();

  if (ghosts.length === 0) return null;

  return (
    <>
      {ghosts.map((ghost: GhostTrail, i: number) => (
        <GhostLine
          key={`ghost-${ghostVersion}-${i}`}
          ghost={ghost}
          index={i}
          total={ghosts.length}
        />
      ))}
    </>
  );
};
