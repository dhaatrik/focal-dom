import { FocalDOMProject } from '@focaldom/core';

export function createDefaultProject(): FocalDOMProject {
  return {
    id: 'focal-demo-01',
    title: 'FocalDOM Demo Recording',
    version: '0.1.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    rawVideoPath: '',
    aspectRatio: '16:9',
    canvasPadding: 48,
    backgroundStyle: {
      type: 'gradient',
      colors: ['#0f172a', '#1e1b4b'],
    },
    windowFrame: {
      showControls: true,
      borderRadius: 16,
      shadowBlur: 32,
      shadowSpread: 6,
      shadowColor: '#000000',
    },
    springConfig: {
      stiffness: 180,
      damping: 24,
      mass: 1.0,
    },
    keyframes: [
      {
        id: 'kf-intro',
        timestampMs: 500,
        durationMs: 2000,
        zoomScale: 1.8,
        panOffset: { x: -140, y: -80 },
        easingCurve: 'spring',
        autoZoomGenerated: true,
      },
      {
        id: 'kf-action',
        timestampMs: 3200,
        durationMs: 1800,
        zoomScale: 2.2,
        panOffset: { x: 100, y: 40 },
        easingCurve: 'spring',
        autoZoomGenerated: false,
      },
    ],
    events: [
      {
        frameIndex: 0,
        timestamp: 0,
        eventType: 'hover',
        cursor: { x: 200, y: 150 },
        viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
        scrollOffset: { x: 0, y: 0 },
        activeStickyRegions: [],
      },
      {
        frameIndex: 30,
        timestamp: 500,
        eventType: 'click',
        cursor: { x: 450, y: 280 },
        viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
        scrollOffset: { x: 0, y: 0 },
        activeStickyRegions: [],
      },
      {
        frameIndex: 120,
        timestamp: 2000,
        eventType: 'input',
        cursor: { x: 600, y: 350 },
        viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
        scrollOffset: { x: 0, y: 0 },
        activeStickyRegions: [],
      },
      {
        frameIndex: 192,
        timestamp: 3200,
        eventType: 'click',
        cursor: { x: 920, y: 450 },
        viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
        scrollOffset: { x: 0, y: 0 },
        activeStickyRegions: [],
      },
    ],
  };
}
