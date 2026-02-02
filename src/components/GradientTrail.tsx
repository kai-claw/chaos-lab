import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GradientTrailProps {
  /** Array of Vector3 points (can be raw system points) */
  points: THREE.Vector3[];
  hueStart: number;
  hueEnd: number;
  /** Scale applied to x/y/z of each point during buffer copy */
  scale?: number;
  /** Whether to zero-out z (for 2D systems like double pendulum) */
  flatZ?: boolean;
  glowIntensity?: number;
}

/** Maximum points the trail buffer can hold */
const MAX_POINTS = 6000;

/**
 * A gorgeous gradient trail with glow effect.
 * Colors shift from hueStart→hueEnd along the trail (old→new).
 * Opacity fades at the old end for a trailing-off effect.
 *
 * Accepts an optional `scale` factor so callers can pass raw system
 * points without creating intermediate scaled-Vector3 arrays every frame.
 */
export const GradientTrail: React.FC<GradientTrailProps> = ({
  points,
  hueStart,
  hueEnd,
  scale = 1,
  flatZ = false,
  glowIntensity = 0.6,
}) => {
  const lineRef = useRef<THREE.Line>(null);
  const glowRef = useRef<THREE.Line>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const glowGeometryRef = useRef<THREE.BufferGeometry>(null);

  const { posBuffer, colorBuffer, glowColorBuffer } = useMemo(() => ({
    posBuffer: new Float32Array(MAX_POINTS * 3),
    colorBuffer: new Float32Array(MAX_POINTS * 3),
    glowColorBuffer: new Float32Array(MAX_POINTS * 3),
  }), []);

  useFrame(() => {
    if (!geometryRef.current || !glowGeometryRef.current) return;
    const len = Math.min(points.length, MAX_POINTS);
    if (len < 2) {
      geometryRef.current.setDrawRange(0, 0);
      glowGeometryRef.current.setDrawRange(0, 0);
      return;
    }

    const startIdx = Math.max(0, points.length - MAX_POINTS);
    const s = scale;

    for (let i = 0; i < len; i++) {
      const p = points[startIdx + i];
      const idx = i * 3;

      posBuffer[idx]     = p.x * s;
      posBuffer[idx + 1] = p.y * s;
      posBuffer[idx + 2] = flatZ ? 0 : p.z * s;

      const t = i / (len - 1);
      const alpha = t * t; // quadratic fade for old end
      const hue = hueStart + (hueEnd - hueStart) * t;
      const sat = 0.85;
      const light = 0.35 + alpha * 0.45;

      // Inline HSL → RGB (avoids creating THREE.Color each iteration)
      const c = (1 - Math.abs(2 * light - 1)) * sat;
      const h6 = ((hue % 1) + 1) % 1 * 6;
      const x = c * (1 - Math.abs((h6 % 2) - 1));
      const m = light - c / 2;
      const sector = Math.floor(h6) % 6;

      let r = 0, g = 0, b = 0;
      switch (sector) {
        case 0: r = c; g = x; break;
        case 1: r = x; g = c; break;
        case 2: g = c; b = x; break;
        case 3: g = x; b = c; break;
        case 4: r = x; b = c; break;
        case 5: r = c; b = x; break;
      }

      colorBuffer[idx]     = (r + m) * alpha;
      colorBuffer[idx + 1] = (g + m) * alpha;
      colorBuffer[idx + 2] = (b + m) * alpha;

      const gAlpha = alpha * glowIntensity;
      glowColorBuffer[idx]     = (r + m) * gAlpha * 1.5;
      glowColorBuffer[idx + 1] = (g + m) * gAlpha * 1.5;
      glowColorBuffer[idx + 2] = (b + m) * gAlpha * 1.5;
    }

    // Update main geometry
    const posAttr = geometryRef.current.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = geometryRef.current.getAttribute('color') as THREE.BufferAttribute;
    posAttr.set(posBuffer.subarray(0, len * 3));
    colAttr.set(colorBuffer.subarray(0, len * 3));
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    geometryRef.current.setDrawRange(0, len);

    // Update glow geometry
    const gPosAttr = glowGeometryRef.current.getAttribute('position') as THREE.BufferAttribute;
    const gColAttr = glowGeometryRef.current.getAttribute('color') as THREE.BufferAttribute;
    gPosAttr.set(posBuffer.subarray(0, len * 3));
    gColAttr.set(glowColorBuffer.subarray(0, len * 3));
    gPosAttr.needsUpdate = true;
    gColAttr.needsUpdate = true;
    glowGeometryRef.current.setDrawRange(0, len);
  });

  useEffect(() => {
    if (!geometryRef.current || !glowGeometryRef.current) return;
    geometryRef.current.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_POINTS * 3), 3));
    geometryRef.current.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_POINTS * 3), 3));
    geometryRef.current.setDrawRange(0, 0);

    glowGeometryRef.current.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_POINTS * 3), 3));
    glowGeometryRef.current.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_POINTS * 3), 3));
    glowGeometryRef.current.setDrawRange(0, 0);
  }, []);

  const mainMat = useMemo(() => new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  const glowMat = useMemo(() => new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  return (
    <>
      <primitive object={new THREE.Line()} ref={lineRef}>
        <bufferGeometry ref={geometryRef} />
        <primitive object={mainMat} attach="material" />
      </primitive>
      <primitive object={new THREE.Line()} ref={glowRef}>
        <bufferGeometry ref={glowGeometryRef} />
        <primitive object={glowMat} attach="material" />
      </primitive>
    </>
  );
};
