import { describe, it, expect } from 'vitest';
import {
  isValidDOMElementRect,
  isValidDOMEventFrame,
  createProject,
  DOMEventFrame,
  DOMElementRect,
} from '../src/events/index';

describe('DOM Event & Project Schemas', () => {
  it('validates correct DOMElementRect', () => {
    const validRect: DOMElementRect = {
      top: 100,
      left: 50,
      width: 200,
      height: 40,
      isFixedOrSticky: true,
      computedZIndex: 10,
    };
    expect(isValidDOMElementRect(validRect)).toBe(true);

    const invalidRect = { top: 100, left: '50' };
    expect(isValidDOMElementRect(invalidRect)).toBe(false);
    expect(isValidDOMElementRect(null)).toBe(false);
  });

  it('validates correct DOMEventFrame', () => {
    const validFrame: DOMEventFrame = {
      frameIndex: 0,
      timestamp: 0,
      eventType: 'click',
      cursor: { x: 100, y: 150 },
      viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
      scrollOffset: { x: 0, y: 0 },
      activeStickyRegions: [],
    };
    expect(isValidDOMEventFrame(validFrame)).toBe(true);

    const invalidFrame = { frameIndex: '0', eventType: 'invalid-type' };
    expect(isValidDOMEventFrame(invalidFrame)).toBe(false);
  });

  it('creates default FocalDOM project structure', () => {
    const project = createProject({
      id: 'proj_123',
      title: 'Demo Walkthrough',
      rawVideoPath: '/path/to/raw.mp4',
    });

    expect(project.id).toBe('proj_123');
    expect(project.aspectRatio).toBe('16:9');
    expect(project.springConfig.stiffness).toBe(140);
    expect(project.springConfig.damping).toBe(16);
    expect(project.keyframes).toEqual([]);
    expect(project.events).toEqual([]);
  });
});
