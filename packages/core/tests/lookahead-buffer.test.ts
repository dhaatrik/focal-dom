import { describe, it, expect } from 'vitest';
import { generateKeyframesFromEvents } from '../src/camera/lookahead-buffer';
import { DOMEventFrame } from '../src/events/dom-event-schema';

describe('Lookahead Buffer Keyframe Generator', () => {
  const viewport = { width: 1920, height: 1080 };

  it('generates anticipatory camera keyframe 400ms before click timestamp', () => {
    const events: DOMEventFrame[] = [
      {
        frameIndex: 60,
        timestamp: 1000,
        eventType: 'click',
        cursor: { x: 500, y: 300 },
        viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
        scrollOffset: { x: 0, y: 0 },
        activeStickyRegions: [],
        targetElement: {
          tagName: 'button',
          id: 'submit-btn',
          classList: ['btn', 'btn-primary'],
          boundingRect: {
            top: 280,
            left: 450,
            width: 100,
            height: 40,
            isFixedOrSticky: false,
            computedZIndex: 1,
          },
        },
      },
    ];

    const keyframes = generateKeyframesFromEvents(events, viewport, { lookAheadDurationMs: 400 });

    expect(keyframes.length).toBe(1);
    expect(keyframes[0].timestampMs).toBe(600); // 1000 - 400
    expect(keyframes[0].durationMs).toBe(1600); // 400 + 1200
    expect(keyframes[0].zoomScale).toBeGreaterThanOrEqual(1.25);
    expect(keyframes[0].autoZoomGenerated).toBe(true);
    expect(keyframes[0].targetElementSelector).toBe('#submit-btn');
    expect(keyframes[0].easingCurve).toBe('spring');
  });

  it('clusters consecutive rapid form inputs into seamless pan transitions without zoom pumping', () => {
    const events: DOMEventFrame[] = [
      {
        frameIndex: 60,
        timestamp: 1000,
        eventType: 'click',
        cursor: { x: 200, y: 200 },
        viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
        scrollOffset: { x: 0, y: 0 },
        activeStickyRegions: [],
        targetElement: {
          tagName: 'input',
          id: 'first-name',
          classList: ['form-input'],
          boundingRect: { top: 200, left: 200, width: 200, height: 40, isFixedOrSticky: false, computedZIndex: 1 },
        },
      },
      {
        frameIndex: 120,
        timestamp: 2200, // 1200ms later (within 2000ms cluster threshold)
        eventType: 'input',
        cursor: { x: 200, y: 280 },
        viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
        scrollOffset: { x: 0, y: 0 },
        activeStickyRegions: [],
        targetElement: {
          tagName: 'input',
          id: 'last-name',
          classList: ['form-input'],
          boundingRect: { top: 280, left: 200, width: 200, height: 40, isFixedOrSticky: false, computedZIndex: 1 },
        },
      },
    ];

    const keyframes = generateKeyframesFromEvents(events, viewport, {
      lookAheadDurationMs: 400,
      zoomHoldDurationMs: 1200,
      clusterThresholdMs: 2000,
      defaultEasingCurve: 'easeInOutCubic',
    });

    expect(keyframes.length).toBe(2);

    // First keyframe starts at 1000 - 400 = 600ms
    expect(keyframes[0].timestampMs).toBe(600);
    // Second keyframe starts at 2200 - 400 = 1800ms
    expect(keyframes[1].timestampMs).toBe(1800);
    // First keyframe duration is extended to 1800 - 600 = 1200ms so it seamlessly connects to second keyframe
    expect(keyframes[0].durationMs).toBe(1200);
    // Second keyframe holds for 400 + 1200 = 1600ms
    expect(keyframes[1].durationMs).toBe(1600);

    // Verify custom easing was propagated
    expect(keyframes[0].easingCurve).toBe('easeInOutCubic');
    expect(keyframes[1].easingCurve).toBe('easeInOutCubic');
  });

  it('separates distant interactions into distinct keyframe clusters with zoom reset interval', () => {
    const events: DOMEventFrame[] = [
      {
        frameIndex: 60,
        timestamp: 1000,
        eventType: 'click',
        cursor: { x: 200, y: 200 },
        viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
        scrollOffset: { x: 0, y: 0 },
        activeStickyRegions: [],
        targetElement: {
          tagName: 'button',
          id: 'btn-1',
          classList: [],
          boundingRect: { top: 100, left: 100, width: 80, height: 30, isFixedOrSticky: false, computedZIndex: 1 },
        },
      },
      {
        frameIndex: 360,
        timestamp: 6000, // 5000ms later (> 2000ms cluster threshold)
        eventType: 'click',
        cursor: { x: 800, y: 500 },
        viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
        scrollOffset: { x: 0, y: 0 },
        activeStickyRegions: [],
        targetElement: {
          tagName: 'button',
          id: 'btn-2',
          classList: [],
          boundingRect: { top: 500, left: 800, width: 80, height: 30, isFixedOrSticky: false, computedZIndex: 1 },
        },
      },
    ];

    const keyframes = generateKeyframesFromEvents(events, viewport, { clusterThresholdMs: 2000 });

    expect(keyframes.length).toBe(2);
    expect(keyframes[0].timestampMs).toBe(600);
    expect(keyframes[0].durationMs).toBe(1600); // 600 + 1600 = 2200ms end

    expect(keyframes[1].timestampMs).toBe(5600); // 6000 - 400 = 5600ms
    expect(keyframes[1].durationMs).toBe(1600);
  });
});
