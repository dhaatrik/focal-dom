import { DOMElementRect } from '../events/dom-event-schema';
import { ViewportDimensions } from '../camera/camera-types';

export interface ViewportDeadZones {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface DeadZoneOptions {
  maxObstructionRatio?: number; // Default 0.65 (65% of viewport dimension max)
}

/**
 * Evaluates all visible sticky and fixed headers to aggregate directional safe-zone boundaries.
 * Includes dead-zone ceiling caps to prevent usable viewport collapse.
 */
export function computeViewportDeadZones(
  stickyRegions: DOMElementRect[],
  viewport: ViewportDimensions,
  options: DeadZoneOptions = {}
): ViewportDeadZones {
  const maxRatio = options.maxObstructionRatio ?? 0.65;
  let topDeadZone = 0;
  let bottomDeadZone = 0;
  let leftDeadZone = 0;
  let rightDeadZone = 0;

  for (const rect of stickyRegions) {
    if (!rect.isFixedOrSticky) continue;

    // Top fixed navigation bar (spans at least 40% of viewport width)
    if (rect.top <= 10 && rect.width >= viewport.width * 0.4) {
      topDeadZone = Math.max(topDeadZone, rect.top + rect.height);
    }

    // Bottom fixed toolbar
    if (rect.top + rect.height >= viewport.height - 10 && rect.width >= viewport.width * 0.4) {
      bottomDeadZone = Math.max(bottomDeadZone, viewport.height - rect.top);
    }

    // Left fixed sidebar (spans at least 40% of viewport height)
    if (rect.left <= 10 && rect.height >= viewport.height * 0.4) {
      leftDeadZone = Math.max(leftDeadZone, rect.left + rect.width);
    }

    // Right fixed sidebar
    if (rect.left + rect.width >= viewport.width - 10 && rect.height >= viewport.height * 0.4) {
      rightDeadZone = Math.max(rightDeadZone, viewport.width - rect.left);
    }
  }

  // Apply dead zone ceiling protection to prevent screen space inversion / collapse
  const maxVerticalDeadZone = viewport.height * maxRatio;
  const totalVertical = topDeadZone + bottomDeadZone;
  if (totalVertical > maxVerticalDeadZone && totalVertical > 0) {
    const scale = maxVerticalDeadZone / totalVertical;
    topDeadZone *= scale;
    bottomDeadZone *= scale;
  }

  const maxHorizontalDeadZone = viewport.width * maxRatio;
  const totalHorizontal = leftDeadZone + rightDeadZone;
  if (totalHorizontal > maxHorizontalDeadZone && totalHorizontal > 0) {
    const scale = maxHorizontalDeadZone / totalHorizontal;
    leftDeadZone *= scale;
    rightDeadZone *= scale;
  }

  return {
    top: Math.round(topDeadZone),
    bottom: Math.round(bottomDeadZone),
    left: Math.round(leftDeadZone),
    right: Math.round(rightDeadZone),
  };
}
