import { ClickRippleState } from './cursor-types';

export interface EvaluatedRipple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  active: boolean;
}

/**
 * Evaluates the instantaneous expanding radius and alpha decay of an animated click ripple.
 */
export function evaluateClickRipple(
  ripple: ClickRippleState,
  currentTimestampMs: number
): EvaluatedRipple {
  const elapsed = currentTimestampMs - ripple.startTimeMs;

  if (elapsed < 0 || elapsed > ripple.durationMs) {
    return {
      x: ripple.x,
      y: ripple.y,
      radius: 0,
      alpha: 0,
      active: false,
    };
  }

  const progress = elapsed / ripple.durationMs;

  // Ease-out cubic for expansion: r(t) = R_max * (1 - (1 - t)^3)
  const easeOut = 1 - Math.pow(1 - progress, 3);
  const radius = ripple.maxRadius * easeOut;

  // Linear or exponential alpha decay: alpha(t) = 1 - t
  const alpha = Math.max(0, 1 - progress);

  return {
    x: ripple.x,
    y: ripple.y,
    radius: Math.round(radius * 10) / 10,
    alpha: Math.round(alpha * 100) / 100,
    active: true,
  };
}
