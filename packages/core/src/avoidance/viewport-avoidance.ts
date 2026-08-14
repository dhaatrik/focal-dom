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

/**
 * Calculates camera target pan offset and zoom scale with sticky viewport avoidance framing.
 * Ensures the target element is framed within the unobstructed viewport real estate.
 */
export function calculateTargetFromElement(params: TargetCalculationParams): TargetCalculationResult {
  const {
    elementRect,
    viewport,
    stickyRegions = [],
    paddingRatio = 1.8,
    minScale = 1.25,
    maxScale = 2.2,
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
  const targetX = (usableCenterX - elementCenterX) * desiredScale;
  const targetY = (usableCenterY - elementCenterY) * desiredScale;

  return {
    targetState: {
      x: Math.round(targetX * 100) / 100,
      y: Math.round(targetY * 100) / 100,
      scale: Math.round(desiredScale * 1000) / 1000,
    },
    usableBounds: {
      x: usableX,
      y: usableY,
      width: usableWidth,
      height: usableHeight,
    },
    deadZones,
  };
}
