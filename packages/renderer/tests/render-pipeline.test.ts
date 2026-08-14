import { describe, it, expect } from 'vitest';
import { FocalDOMProject } from '@focaldom/core';
import { FrameTicker } from '../src/engine/frame-ticker';
import { FocalSceneGraph } from '../src/engine/scene-graph';
import { RenderDimensions } from '../src/engine/scene-types';

describe('Renderer Engine & Scene Graph Pipeline', () => {
  const mockProject: FocalDOMProject = {
    id: 'test-proj-01',
    title: 'Test Render Project',
    version: '0.1.0',
    createdAt: 1000,
    updatedAt: 1000,
    rawVideoPath: './test.mp4',
    aspectRatio: '16:9',
    canvasPadding: 48,
    backgroundStyle: {
      type: 'gradient',
      colors: ['#0f172a', '#1e293b'],
    },
    windowFrame: {
      showControls: true,
      borderRadius: 16,
      shadowBlur: 24,
      shadowSpread: 4,
      shadowColor: '#000000',
    },
    springConfig: {
      stiffness: 170,
      damping: 26,
      mass: 1.0,
    },
    keyframes: [
      {
        id: 'kf-1',
        timestampMs: 500,
        durationMs: 1000,
        zoomScale: 2.0,
        panOffset: { x: -120, y: -80 },
        easingCurve: 'spring',
        autoZoomGenerated: true,
      },
    ],
    events: [
      {
        frameIndex: 0,
        timestamp: 0,
        eventType: 'hover',
        cursor: { x: 100, y: 100 },
        viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
        scrollOffset: { x: 0, y: 0 },
        activeStickyRegions: [],
      },
      {
        frameIndex: 30,
        timestamp: 500,
        eventType: 'click',
        cursor: { x: 400, y: 300 },
        viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
        scrollOffset: { x: 0, y: 0 },
        activeStickyRegions: [],
      },
    ],
  };

  it('evaluates timeline frames with spring camera zoom and cursor motion', () => {
    const ticker = new FrameTicker(mockProject);

    // Initial state at t=0
    const frame0 = ticker.evaluate(0);
    expect(frame0.cursor.visible).toBe(true);
    expect(frame0.cursor.x).toBe(100);
    expect(frame0.cursor.y).toBe(100);
    expect(frame0.camera.zoomScale).toBeCloseTo(1.0, 1);

    // State at keyframe midpoint t=1000ms
    const frameMid = ticker.evaluate(1000);
    expect(frameMid.camera.zoomScale).toBeGreaterThan(1.0);
    expect(frameMid.cursor.x).toBe(400);
  });

  it('evaluates click ripple expansion during active ripple window', () => {
    const ticker = new FrameTicker(mockProject);

    // Click occurred at t=500ms
    const frameRipple = ticker.evaluate(600);
    expect(frameRipple.activeRipples.length).toBeGreaterThan(0);
    expect(frameRipple.activeRipples[0].radius).toBeGreaterThan(0);
    expect(frameRipple.activeRipples[0].alpha).toBeGreaterThan(0);
  });

  it('instantiates FocalSceneGraph and updates layer properties without error', () => {
    const dimensions: RenderDimensions = {
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      devicePixelRatio: 1,
    };

    const scene = new FocalSceneGraph({
      dimensions,
      project: mockProject,
      enableMotionBlur: true,
    });

    expect(scene.children.length).toBeGreaterThan(0);
    expect(scene.backgroundLayer).toBeDefined();
    expect(scene.windowLayer).toBeDefined();
    expect(scene.videoViewportLayer).toBeDefined();
    expect(scene.vectorCursorLayer).toBeDefined();

    const ticker = new FrameTicker(mockProject);
    const evalResult = ticker.evaluate(500);

    expect(() => scene.updateFromEvaluation(evalResult)).not.toThrow();
  });
});
