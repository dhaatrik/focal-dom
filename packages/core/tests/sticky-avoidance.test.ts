import { describe, it, expect } from 'vitest';
import { computeViewportDeadZones } from '../src/avoidance/sticky-detector';
import { calculateTargetFromElement, clampTargetToBounds } from '../src/avoidance/viewport-avoidance';
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

  it('enforces dead-zone ceiling cap when sticky elements occupy excessive screen area', () => {
    // 90% top banner + 30% bottom banner
    const hugeTopBanner: DOMElementRect = {
      top: 0,
      left: 0,
      width: 1920,
      height: 900,
      isFixedOrSticky: true,
      computedZIndex: 999,
    };

    const deadZones = computeViewportDeadZones([hugeTopBanner], viewport, { maxObstructionRatio: 0.65 });
    // Total vertical obstruction should be capped to 65% of 1080 = 702px
    expect(deadZones.top + deadZones.bottom).toBeLessThanOrEqual(702);
  });

  describe('clampTargetToBounds', () => {
    it('clamps pan offsets to prevent black canvas borders on 32:9 ultrawide viewports', () => {
      const ultraWideViewport = { width: 5120, height: 1440 };
      const rawTarget = { x: 3000, y: -800, scale: 1.5 };

      const clamped = clampTargetToBounds(rawTarget, ultraWideViewport, 24);

      // maxPanX = (5120 * 0.5) / 2 - 24 = 1280 - 24 = 1256
      // maxPanY = (1440 * 0.5) / 2 - 24 = 360 - 24 = 336
      expect(clamped.x).toBe(1256);
      expect(clamped.y).toBe(-336);
      expect(clamped.scale).toBe(1.5);
    });

    it('clamps pan offsets safely on 9:16 portrait mobile viewports', () => {
      const portraitViewport = { width: 1080, height: 1920 };
      const rawTarget = { x: -600, y: 1500, scale: 2.0 };

      const clamped = clampTargetToBounds(rawTarget, portraitViewport, 20);

      // maxPanX = (1080 * 1.0) / 2 - 20 = 540 - 20 = 520
      // maxPanY = (1920 * 1.0) / 2 - 20 = 960 - 20 = 940
      expect(clamped.x).toBe(-520);
      expect(clamped.y).toBe(940);
    });

    it('resets pan offset to 0 when scale is 1.0', () => {
      const target = { x: 500, y: -200, scale: 1.0 };
      const clamped = clampTargetToBounds(target, viewport);
      expect(clamped.x).toBe(0);
      expect(clamped.y).toBe(0);
      expect(clamped.scale).toBe(1.0);
    });
  });
});
