import { DOMEventFrame, CameraKeyframe } from '../events/dom-event-schema';
import { ViewportDimensions } from './camera-types';
import { calculateTargetFromElement } from '../avoidance/viewport-avoidance';

export interface LookAheadOptions {
  lookAheadDurationMs?: number; // Default 400ms
  zoomHoldDurationMs?: number; // Default 1200ms
  minScale?: number; // Default 1.25
  maxScale?: number; // Default 2.2
  paddingRatio?: number; // Default 1.8
}

/**
 * Scans a sequential DOM event log and auto-generates anticipatory CameraKeyframes
 * with a 400ms lookahead ease-in before user clicks, form inputs, or focus actions.
 */
export function generateKeyframesFromEvents(
  events: DOMEventFrame[],
  viewport: ViewportDimensions,
  options: LookAheadOptions = {}
): CameraKeyframe[] {
  const lookAheadMs = options.lookAheadDurationMs ?? 400;
  const holdDurationMs = options.zoomHoldDurationMs ?? 1200;
  const keyframes: CameraKeyframe[] = [];

  // Filter for significant interaction events that have target element bounding rects
  const interactionEvents = events.filter(
    (e) => (e.eventType === 'click' || e.eventType === 'input' || e.eventType === 'focus') && e.targetElement?.boundingRect
  );

  let lastKeyframeEndMs = 0;

  for (let i = 0; i < interactionEvents.length; i++) {
    const event = interactionEvents[i];
    const element = event.targetElement!;
    const clickTimestamp = event.timestamp;

    // Calculate anticipatory start time (T - lookahead)
    const startTimeMs = Math.max(0, clickTimestamp - lookAheadMs);

    // Prevent keyframe overlap with previous zoom
    if (startTimeMs < lastKeyframeEndMs) {
      continue;
    }

    const { targetState } = calculateTargetFromElement({
      elementRect: element.boundingRect,
      viewport,
      stickyRegions: event.activeStickyRegions || [],
      minScale: options.minScale,
      maxScale: options.maxScale,
      paddingRatio: options.paddingRatio,
    });

    const keyframe: CameraKeyframe = {
      id: `kf_auto_${i}_${Math.round(clickTimestamp)}`,
      timestampMs: startTimeMs,
      durationMs: lookAheadMs + holdDurationMs,
      zoomScale: targetState.scale,
      panOffset: {
        x: targetState.x,
        y: targetState.y,
      },
      easingCurve: 'spring',
      autoZoomGenerated: true,
      targetElementSelector: element.id ? `#${element.id}` : element.tagName,
    };

    keyframes.push(keyframe);
    lastKeyframeEndMs = startTimeMs + keyframe.durationMs;
  }

  return keyframes;
}
