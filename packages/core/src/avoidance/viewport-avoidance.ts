import { DOMElementRect } from '../events/dom-event-schema';
import { CameraState, ViewportDimensions } from '../camera/camera-types';
import { computeViewportDeadZones, ViewportDeadZones } from './sticky-detector';

export interface TargetCalculationParams {
  elementRect: DOMElementRect;
  viewport: ViewportDimensions;
  stickyRegions?: DOMElementRect[];
  paddingRatio?: number; // Default 1.8
  minScale?: number; // Default 1.25
  maxScale?: number; // Default 2.2
  boundaryMarginPx?: number; // Default 24px safe margin guardrail
}

export interface TargetCalculationResult {
  targetState: CameraState;
  usableBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  deadZones: ViewportDeadZones;
}

function sanitizeZero(val: number): number {
  const rounded = Math.round(val * 100) / 100;
  return Object.is(rounded, -0) || rounded === 0 ? 0 : rounded;
}

/**
 * Clamps target camera pan offsets to ensure content edges do not expose canvas margins
 * or overflow viewport boundaries across extreme aspect ratios (32:9 ultrawide to 9:16 portrait).
 */
export function clampTargetToBounds(
  target: CameraState,
  viewport: ViewportDimensions,
  marginPx = 24
): CameraState {
  const scale = Math.max(1.0, isFinite(target.scale) ? target.scale : 1.0);
  const maxPanX = Math.max(0, (viewport.width * (scale - 1)) / 2 - marginPx);
  const maxPanY = Math.max(0, (viewport.height * (scale - 1)) / 2 - marginPx);

  const rawX = isFinite(target.x) ? target.x : 0;
  const rawY = isFinite(target.y) ? target.y : 0;

  const clampedX = maxPanX === 0 ? 0 : Math.max(-maxPanX, Math.min(maxPanX, rawX));
  const clampedY = maxPanY === 0 ? 0 : Math.max(-maxPanY, Math.min(maxPanY, rawY));

  return {
    scale: Math.round(scale * 1000) / 1000,
    x: sanitizeZero(clampedX),
    y: sanitizeZero(clampedY),
  };
}

/**
 * Calculates camera target pan offset and zoom scale with sticky viewport avoidance framing
 * and aspect-ratio guardrails.
 */
export function calculateTargetFromElement(params: TargetCalculationParams): TargetCalculationResult {
  const {
    elementRect,
    viewport,
    stickyRegions = [],
    paddingRatio = 1.8,
    minScale = 1.25,
    maxScale = 2.2,
    boundaryMarginPx = 24,
  } = params;

  const deadZones = computeViewportDeadZones(stickyRegions, viewport);

  const usableX = deadZones.left;
  const usableY = deadZones.top;
  const usableWidth = Math.max(100, viewport.width - deadZones.left - deadZones.right);
  const usableHeight = Math.max(100, viewport.height - deadZones.top - deadZones.bottom);

  // Calculate zoom scale based on usable viewport dimensions
  const scaleX = usableWidth / (Math.max(10, elementRect.width) * paddingRatio);
  const scaleY = usableHeight / (Math.max(10, elementRect.height) * paddingRatio);

  const rawScale = Math.min(scaleX, scaleY);
  const desiredScale = Math.min(Math.max(rawScale, minScale), maxScale);

  // Center of element in screen space
  const elementCenterX = elementRect.left + elementRect.width / 2;
  const elementCenterY = elementRect.top + elementRect.height / 2;

  // Center of usable unobstructed screen space
  const usableCenterX = usableX + usableWidth / 2;
  const usableCenterY = usableY + usableHeight / 2;

  // Calculate pan translation offset to place element center at usable center
  const rawTargetX = (usableCenterX - elementCenterX) * desiredScale;
  const rawTargetY = (usableCenterY - elementCenterY) * desiredScale;

  // Apply boundary guardrails against extreme aspect ratios (32:9, 21:9, 9:16)
  const targetState = clampTargetToBounds(
    {
      x: rawTargetX,
      y: rawTargetY,
      scale: desiredScale,
    },
    viewport,
    boundaryMarginPx
  );

  return {
    targetState,
    usableBounds: {
      x: usableX,
      y: usableY,
      width: usableWidth,
      height: usableHeight,
    },
    deadZones,
  };
}
