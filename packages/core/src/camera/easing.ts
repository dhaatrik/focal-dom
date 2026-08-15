import { EasingCurve } from '../events/dom-event-schema';
import { CameraState } from './camera-types';

/**
 * Evaluates a normalized closed-form analytical easing curve for parameter t in [0, 1].
 *
 * Supported curves:
 * - 'linear': Constant velocity linear interpolation
 * - 'easeInOutCubic': Smooth cubic S-curve acceleration and deceleration
 * - 'spring': Fallback for analytical evaluation, returns linear baseline (springs are simulated via ODE)
 */
export function evaluateEasingCurve(curve: EasingCurve, t: number): number {
  if (!isFinite(t)) return 0;
  const clampedT = Math.max(0, Math.min(1, t));

  switch (curve) {
    case 'linear':
      return clampedT;

    case 'easeInOutCubic':
      return clampedT < 0.5
        ? 4 * clampedT * clampedT * clampedT
        : 1 - Math.pow(-2 * clampedT + 2, 3) / 2;

    case 'spring':
    default:
      // Spring dynamics are simulated dynamically via 2nd-order ODE;
      // when sampled analytically, evaluate as smooth cubic ease-in-out fallback
      return clampedT < 0.5
        ? 4 * clampedT * clampedT * clampedT
        : 1 - Math.pow(-2 * clampedT + 2, 3) / 2;
  }
}

/**
 * Interpolates between two CameraState poses using an analytical easing curve.
 */
export function interpolateCameraState(
  from: CameraState,
  to: CameraState,
  t: number,
  curve: EasingCurve = 'easeInOutCubic'
): CameraState {
  const factor = evaluateEasingCurve(curve, t);

  return {
    x: from.x + (to.x - from.x) * factor,
    y: from.y + (to.y - from.y) * factor,
    scale: from.scale + (to.scale - from.scale) * factor,
  };
}

/**
 * Calculates the first derivative (instantaneous velocity rate multiplier) of an analytical easing curve.
 */
export function evaluateEasingVelocity(
  curve: EasingCurve,
  t: number,
  durationSeconds: number
): number {
  if (durationSeconds <= 0 || !isFinite(durationSeconds)) return 0;
  const clampedT = Math.max(0, Math.min(1, t));

  let dE_dt = 1;
  switch (curve) {
    case 'linear':
      dE_dt = 1;
      break;

    case 'easeInOutCubic':
    case 'spring':
    default:
      if (clampedT < 0.5) {
        dE_dt = 12 * clampedT * clampedT;
      } else {
        dE_dt = 6 * Math.pow(-2 * clampedT + 2, 2);
      }
      break;
  }

  return dE_dt / durationSeconds;
}
