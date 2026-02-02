import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { systemRef } from '../store/systemRef';

/**
 * Cinematic Chase Camera — follows the trail head through the attractor.
 * Creates a mesmerizing first-person flythrough experience.
 * Smooth exponential lerping prevents nausea-inducing jerks.
 */

const SCALE_MAP: Record<string, number> = {
  lorenz: 0.1,
  rossler: 0.5,
  doublePendulum: 1.0,
};

/** How far behind (in point indices) to look for velocity calculation */
const VELOCITY_LOOKBACK = 20;

/** How far behind the head the camera sits (in world units) */
const FOLLOW_DISTANCE: Record<string, number> = {
  lorenz: 0.8,
  rossler: 4.0,
  doublePendulum: 2.0,
};

/** Height offset above the trajectory plane */
const HEIGHT_OFFSET: Record<string, number> = {
  lorenz: 0.4,
  rossler: 2.0,
  doublePendulum: 0.5,
};

/** Camera smoothing factor (lower = smoother, 0.01-0.05 range) */
const POSITION_LERP = 0.025;
const LOOKAT_LERP = 0.04;

export const CinematicCamera: React.FC = () => {
  const { cinematicCamera, currentSystem, isPlaying } = useStore();
  const { camera } = useThree();

  const smoothPos = useRef(new THREE.Vector3());
  const smoothLookAt = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const wasActive = useRef(false);
  const savedCameraPos = useRef(new THREE.Vector3());
  const savedCameraRot = useRef(new THREE.Euler());
  const transitionProgress = useRef(0);

  useFrame(() => {
    // Save camera state when first activating
    if (cinematicCamera && !wasActive.current) {
      savedCameraPos.current.copy(camera.position);
      savedCameraRot.current.copy(camera.rotation);
      transitionProgress.current = 0;
      wasActive.current = true;
    }

    // Restore camera when deactivating
    if (!cinematicCamera && wasActive.current) {
      wasActive.current = false;
      initialized.current = false;
      return;
    }

    if (!cinematicCamera) {
      initialized.current = false;
      return;
    }

    const system = systemRef.system;
    if (!system?.points || system.points.length < VELOCITY_LOOKBACK + 5) return;

    const pts = system.points;
    const scale = SCALE_MAP[currentSystem] ?? 0.1;
    const followDist = FOLLOW_DISTANCE[currentSystem] ?? 1.0;
    const heightOff = HEIGHT_OFFSET[currentSystem] ?? 0.5;

    const headIdx = pts.length - 1;
    const behindIdx = Math.max(0, headIdx - VELOCITY_LOOKBACK);
    const head = pts[headIdx];
    const behind = pts[behindIdx];

    // Velocity direction (normalized)
    const velocity = new THREE.Vector3()
      .subVectors(head, behind)
      .normalize();

    // If velocity is essentially zero, use a default direction
    if (velocity.lengthSq() < 0.001) {
      velocity.set(0, 0, 1);
    }

    // For double pendulum (2D), fix camera approach
    const is2D = currentSystem === 'doublePendulum';

    let targetPos: THREE.Vector3;
    let lookTarget: THREE.Vector3;

    if (is2D) {
      // 2D: Camera sits in front (z-axis) tracking the pendulum tip
      const headWorld = new THREE.Vector3(head.x * scale, head.y * scale, 0);
      targetPos = new THREE.Vector3(
        headWorld.x * 0.3, // Slightly offset from center
        headWorld.y * 0.3 + 0.5,
        followDist
      );
      lookTarget = headWorld;
    } else {
      // 3D: Camera follows behind the trajectory with height offset
      const headWorld = new THREE.Vector3(
        head.x * scale,
        head.y * scale,
        head.z * scale
      );

      // Up vector — try to keep camera above
      const up = new THREE.Vector3(0, 1, 0);
      const side = new THREE.Vector3().crossVectors(velocity, up);
      if (side.lengthSq() < 0.001) {
        side.set(1, 0, 0); // Fallback
      }
      side.normalize();

      // Camera position: behind the head + up + slight side offset
      const offset = velocity.clone().multiplyScalar(-followDist * scale)
        .add(up.clone().multiplyScalar(heightOff * scale))
        .add(side.clone().multiplyScalar(0.15 * scale));

      targetPos = headWorld.clone().add(offset);

      // Look ahead of the head
      const lookAheadIdx = Math.min(headIdx, pts.length - 1);
      const lookAhead = pts[lookAheadIdx];
      lookTarget = new THREE.Vector3(
        lookAhead.x * scale,
        lookAhead.y * scale,
        lookAhead.z * scale
      );
    }

    if (!initialized.current) {
      smoothPos.current.copy(camera.position);
      smoothLookAt.current.copy(lookTarget);
      initialized.current = true;
    }

    // Smooth transition from saved position
    transitionProgress.current = Math.min(1, transitionProgress.current + 0.008);
    const t = transitionProgress.current;
    const easedT = t * t * (3 - 2 * t); // smoothstep

    const lerpFactor = isPlaying
      ? POSITION_LERP + (1 - easedT) * 0.1 // Faster transition initially
      : 0.005; // Very slow when paused

    smoothPos.current.lerp(targetPos, lerpFactor);
    smoothLookAt.current.lerp(lookTarget, LOOKAT_LERP + (1 - easedT) * 0.1);

    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothLookAt.current);
  });

  return null;
};
