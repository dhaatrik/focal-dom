import { describe, it, expect } from 'vitest';
import {
  isValidDOMElementRect,
  isValidDOMEventFrame,
  isValidSpringConfig,
  isValidCameraKeyframe,
  isValidFocalDOMProject,
  createProject,
  DOMEventFrame,
  DOMElementRect,
  CameraKeyframe,
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

  it('validates SpringConfig objects', () => {
    expect(isValidSpringConfig({ stiffness: 140, damping: 16, mass: 1.0 })).toBe(true);
    expect(isValidSpringConfig({ stiffness: 140, damping: 16, mass: 1.0, precision: 0.001 })).toBe(true);
    expect(isValidSpringConfig({ stiffness: -10, damping: 16, mass: 1.0 })).toBe(false);
    expect(isValidSpringConfig({ stiffness: 140, damping: 0, mass: 1.0 })).toBe(false);
    expect(isValidSpringConfig(null)).toBe(false);
  });

  it('validates CameraKeyframe structures', () => {
    const validKeyframe: CameraKeyframe = {
      id: 'kf_1',
      timestampMs: 500,
      durationMs: 1200,
      zoomScale: 1.5,
      panOffset: { x: 50, y: -20 },
      easingCurve: 'easeInOutCubic',
      autoZoomGenerated: true,
      targetElementSelector: '#input-field',
    };
    expect(isValidCameraKeyframe(validKeyframe)).toBe(true);

    // Invalid scale out of bounds (< 1.0 or > 5.0)
    expect(isValidCameraKeyframe({ ...validKeyframe, zoomScale: 0.5 })).toBe(false);
    expect(isValidCameraKeyframe({ ...validKeyframe, zoomScale: 10.0 })).toBe(false);

    // Invalid duration
    expect(isValidCameraKeyframe({ ...validKeyframe, durationMs: 0 })).toBe(false);

    // Invalid easing
    expect(isValidCameraKeyframe({ ...validKeyframe, easingCurve: 'invalidCurve' })).toBe(false);
  });

  it('creates and validates complete FocalDOM project structure', () => {
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

    expect(isValidFocalDOMProject(project)).toBe(true);

    // Reject corrupt project bundle
    expect(isValidFocalDOMProject({ ...project, aspectRatio: '99:99' })).toBe(false);
    expect(isValidFocalDOMProject({ ...project, windowFrame: null })).toBe(false);
  });
});
