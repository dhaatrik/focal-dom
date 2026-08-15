export interface MagneticSnapResult {
  snappedMs: number;
  isSnapped: boolean;
  snappedTargetMs?: number;
}

/**
 * Finds the nearest magnetic snap target if within the pixel threshold distance
 */
export function findMagneticSnapPoint(
  targetMs: number,
  snapTargetsMs: number[],
  timelineZoom: number,
  thresholdPx: number = 10
): MagneticSnapResult {
  const thresholdMs = (thresholdPx / timelineZoom) * 1000;
  let closestDiff = Infinity;
  let closestTarget = targetMs;

  for (const target of snapTargetsMs) {
    const diff = Math.abs(target - targetMs);
    if (diff <= thresholdMs && diff < closestDiff) {
      closestDiff = diff;
      closestTarget = target;
    }
  }

  if (closestDiff <= thresholdMs) {
    return {
      snappedMs: closestTarget,
      isSnapped: true,
      snappedTargetMs: closestTarget,
    };
  }

  return {
    snappedMs: targetMs,
    isSnapped: false,
  };
}
