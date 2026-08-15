import { DOMEventFrame, CameraKeyframe, EasingCurve } from '../events/dom-event-schema';
import { ViewportDimensions } from './camera-types';
import { calculateTargetFromElement } from '../avoidance/viewport-avoidance';

export interface LookAheadOptions {
  lookAheadDurationMs?: number; // Default 400ms
  zoomHoldDurationMs?: number; // Default 1200ms
  clusterThresholdMs?: number; // Default 2000ms - maximum idle time between interactions before resetting camera zoom
  minScale?: number; // Default 1.25
  maxScale?: number; // Default 2.2
  paddingRatio?: number; // Default 1.8
  defaultEasingCurve?: EasingCurve; // Default 'spring'
}

/**
 * Scans a sequential DOM event log and auto-generates anticipatory CameraKeyframes
 * with smart event clustering to eliminate zoom-pumping artifacts during rapid user interactions.
 */
export function generateKeyframesFromEvents(
  events: DOMEventFrame[],
  viewport: ViewportDimensions,
  options: LookAheadOptions = {}
): CameraKeyframe[] {
  const lookAheadMs = options.lookAheadDurationMs ?? 400;
  const holdDurationMs = options.zoomHoldDurationMs ?? 1200;
  const clusterThresholdMs = options.clusterThresholdMs ?? 2000;
  const defaultEasing = options.defaultEasingCurve ?? 'spring';
  const keyframes: CameraKeyframe[] = [];

  // Filter for significant interaction events that have target element bounding rects
  const interactionEvents = events
    .filter(
      (e) =>
        (e.eventType === 'click' || e.eventType === 'input' || e.eventType === 'focus') &&
        e.targetElement?.boundingRect
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  if (interactionEvents.length === 0) {
    return keyframes;
  }

  // Partition events into temporal interaction clusters
  const clusters: DOMEventFrame[][] = [];
  let currentCluster: DOMEventFrame[] = [interactionEvents[0]];

  for (let i = 1; i < interactionEvents.length; i++) {
    const prev = interactionEvents[i - 1];
    const curr = interactionEvents[i];

    if (curr.timestamp - prev.timestamp <= clusterThresholdMs) {
      currentCluster.push(curr);
    } else {
      clusters.push(currentCluster);
      currentCluster = [curr];
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Process each cluster into continuous, non-pumping keyframe trajectories
  let globalKeyframeIndex = 0;

  for (const cluster of clusters) {
    let prevClusterKeyframe: CameraKeyframe | null = null;

    for (let j = 0; j < cluster.length; j++) {
      const event = cluster[j];
      const element = event.targetElement!;
      const clickTimestamp = event.timestamp;

      // Calculate anticipatory start time (T - lookahead)
      let startTimeMs = Math.max(0, clickTimestamp - lookAheadMs);

      if (prevClusterKeyframe) {
        // Enforce smooth chaining: new keyframe starts after previous begins with a minimum transition offset
        startTimeMs = Math.max(prevClusterKeyframe.timestampMs + 200, startTimeMs);
        // Extend previous keyframe's duration to seamlessly connect into the new keyframe (zero zoom pumping)
        prevClusterKeyframe.durationMs = Math.max(200, startTimeMs - prevClusterKeyframe.timestampMs);
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
        id: `kf_auto_${globalKeyframeIndex++}_${Math.round(clickTimestamp)}`,
        timestampMs: startTimeMs,
        durationMs: lookAheadMs + holdDurationMs,
        zoomScale: targetState.scale,
        panOffset: {
          x: targetState.x,
          y: targetState.y,
        },
        easingCurve: defaultEasing,
        autoZoomGenerated: true,
        targetElementSelector: element.id ? `#${element.id}` : element.tagName,
      };

      keyframes.push(keyframe);
      prevClusterKeyframe = keyframe;
    }
  }

  return keyframes;
}
