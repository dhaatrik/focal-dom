import { describe, it, expect } from 'vitest';
import { computeViewportDeadZones } from '../src/avoidance/sticky-detector';
import { calculateTargetFromElement } from '../src/avoidance/viewport-avoidance';
import { DOMElementRect } from '../src/events/dom-event-schema';

describe('Sticky Header Avoidance & Safe-Zone Framing', () => {
  const viewport = { width: 1920, height: 1080 };

  it('detects top sticky navigation bar deadzone', () => {
    const stickyHeader: DOMElementRect = {
      top: 0,
      left: 0,
      width: 1920,
      height: 80,
      isFixedOrSticky: true,
      computedZIndex: 999,
    };

    const deadZones = computeViewportDeadZones([stickyHeader], viewport);
    expect(deadZones.top).toBe(80);
    expect(deadZones.bottom).toBe(0);
    expect(deadZones.left).toBe(0);
    expect(deadZones.right).toBe(0);
  });

  it('centers element in unobstructed viewport real estate below sticky header', () => {
    const stickyHeader: DOMElementRect = {
      top: 0,
      left: 0,
      width: 1920,
      height: 100,
      isFixedOrSticky: true,
      computedZIndex: 999,
    };

    const targetButton: DOMElementRect = {
      top: 300,
      left: 800,
      width: 150,
      height: 50,
      isFixedOrSticky: false,
      computedZIndex: 1,
    };

    const result = calculateTargetFromElement({
      elementRect: targetButton,
      viewport,
      stickyRegions: [stickyHeader],
      paddingRatio: 1.8,
    });

    expect(result.deadZones.top).toBe(100);
    expect(result.usableBounds.height).toBe(980); // 1080 - 100
    expect(result.usableBounds.y).toBe(100);
    expect(result.targetState.scale).toBeGreaterThanOrEqual(1.25);
    expect(result.targetState.scale).toBeLessThanOrEqual(2.2);
  });
});
