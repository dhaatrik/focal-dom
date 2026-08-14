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
  });
});
