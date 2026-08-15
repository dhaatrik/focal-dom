import { describe, it, expect } from 'vitest';
import { FocalDOMProject } from '@focaldom/core';
import { FrameTicker } from '../src/engine/frame-ticker';
import { FocalSceneGraph } from '../src/engine/scene-graph';
import { RenderDimensions } from '../src/engine/scene-types';
import { MotionBlurFilter } from '../src/shaders/motion-blur-filter';
import { DropShadowFilter } from '../src/shaders/shadow-filter';
import { FocalPixiApp } from '../src/engine/pixi-app';

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
      {
        id: 'kf-2',
        timestampMs: 2500,
        durationMs: 1000,
        zoomScale: 1.8,
        panOffset: { x: 200, y: 100 },
        easingCurve: 'easeInOutCubic',
        autoZoomGenerated: false,
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

  it('evaluates analytical easeInOutCubic keyframes with exact mathematical trajectory', () => {
    const ticker = new FrameTicker(mockProject);

    // Keyframe 2 starts at t=2500ms and lasts 1000ms (target: x=200, y=100, scale=1.8)
    const frameStart = ticker.evaluate(2500);
    expect(frameStart.camera.zoomScale).toBe(1.0);
    expect(frameStart.camera.panX).toBe(0);

    const frameMid = ticker.evaluate(3000); // t=0.5
    expect(frameMid.camera.zoomScale).toBeCloseTo(1.4, 2); // 1.0 + (1.8 - 1.0)*0.5 = 1.4
    expect(frameMid.camera.panX).toBeCloseTo(100, 1); // 0 + 200*0.5 = 100
    expect(frameMid.camera.panY).toBeCloseTo(50, 1); // 0 + 100*0.5 = 50
    expect(isFinite(frameMid.camera.velocityX)).toBe(true);
    expect(isFinite(frameMid.camera.velocityY)).toBe(true);

    const frameEnd = ticker.evaluate(3500); // t=1.0
    expect(frameEnd.camera.zoomScale).toBe(1.8);
    expect(frameEnd.camera.panX).toBe(200);
    expect(frameEnd.camera.panY).toBe(100);
  });

  it('stabilizes backward timeline scrubbing without velocity explosion', () => {
    const ticker = new FrameTicker(mockProject);

    // Advance to 3000ms
    ticker.evaluate(3000);

    // Scrub backward to 500ms
    const scrubbed = ticker.evaluate(500);
    expect(isFinite(scrubbed.camera.velocityX)).toBe(true);
    expect(isFinite(scrubbed.camera.velocityY)).toBe(true);
    expect(Math.abs(scrubbed.camera.velocityX)).toBeLessThan(10000);
  });

  it('evaluates click ripple expansion during active ripple window', () => {
    const ticker = new FrameTicker(mockProject);

    // Click occurred at t=500ms
    const frameRipple = ticker.evaluate(600);
    expect(frameRipple.activeRipples.length).toBeGreaterThan(0);
    expect(frameRipple.activeRipples[0].radius).toBeGreaterThan(0);
    expect(frameRipple.activeRipples[0].alpha).toBeGreaterThan(0);
  });

  it('instantiates FocalSceneGraph and updates layer properties and dimensions without error', () => {
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

    // Test dynamic resize on scene graph
    const newDimensions: RenderDimensions = {
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      devicePixelRatio: 1,
    };
    expect(() => scene.updateDimensions(newDimensions)).not.toThrow();
  });

  it('supports FocalPixiApp dynamic resize method', () => {
    const dimensions: RenderDimensions = {
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      devicePixelRatio: 1,
    };

    const app = new FocalPixiApp({
      dimensions,
      project: mockProject,
    });

    const newDimensions: RenderDimensions = {
      width: 1080,
      height: 1080,
      aspectRatio: '1:1',
      devicePixelRatio: 1,
    };

    expect(() => app.resize(newDimensions)).not.toThrow();
    expect(app.getTicker()).toBeDefined();
  });

  it('instantiates MotionBlurFilter and DropShadowFilter properly', () => {
    const motionBlur = new MotionBlurFilter(10, -5, 0.01);
    expect(motionBlur).toBeDefined();
    expect(() => motionBlur.setVelocity(20, -10)).not.toThrow();

    const dropShadow = new DropShadowFilter({ blurRadius: 20, quality: 3, alpha: 0.5 });
    expect(dropShadow).toBeDefined();
    expect(dropShadow.shadowAlpha).toBe(0.5);
    expect(dropShadow.offsetX).toBe(0);
  });
});
