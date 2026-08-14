import { describe, it, expect } from 'vitest';
import { ExtensionDOMTracker } from '../src/content/dom-tracker';
import { DOMEventFrame } from '@focaldom/core';

describe('ExtensionDOMTracker (In-Page Interaction Capture)', () => {
  it('initializes and manages tracking lifecycle', () => {
    const emittedFrames: DOMEventFrame[] = [];
    const tracker = new ExtensionDOMTracker((frame) => {
      emittedFrames.push(frame);
    });

    expect(tracker.tracking).toBe(false);

    tracker.start();
    expect(tracker.tracking).toBe(true);

    tracker.stop();
    expect(tracker.tracking).toBe(false);
  });

  it('scans sticky regions without crashing in headless environment', () => {
    const tracker = new ExtensionDOMTracker();
    const stickyRegions = tracker.scanStickyRegions();
    expect(Array.isArray(stickyRegions)).toBe(true);
  });
});
