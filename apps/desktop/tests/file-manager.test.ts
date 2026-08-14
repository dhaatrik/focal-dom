import { describe, it, expect, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import { DesktopFileManager } from '../src/main/file-manager';
import { FocalDOMProject } from '@focaldom/core';

describe('DesktopFileManager (.focal project archiving)', () => {
  const tempDir = path.join(process.cwd(), 'scratch', 'test-focal-pkg');
  const tempFocalPath = path.join(tempDir, 'demo-test.focal');

  afterAll(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it('packs and unpacks a .focal ZIP project bundle with full fidelity', async () => {
    const mockProject: FocalDOMProject = {
      id: 'proj-desktop-1',
      title: 'Desktop Test Project',
      version: '0.1.0',
      createdAt: 1700000000000,
      updatedAt: 1700000005000,
      rawVideoPath: 'videos/recording.mp4',
      aspectRatio: '16:9',
      canvasPadding: 32,
      backgroundStyle: {
        type: 'gradient',
        colors: ['#1e1b4b', '#0f172a'],
      },
      windowFrame: {
        showControls: true,
        borderRadius: 16,
        shadowBlur: 24,
        shadowSpread: 4,
      },
      springConfig: {
        stiffness: 220,
        damping: 26,
        mass: 1.0,
      },
      keyframes: [
        {
          id: 'kf-1',
          timestampMs: 1000,
          durationMs: 2000,
          zoomScale: 2.0,
          panOffset: { x: 50, y: -20 },
          easingCurve: 'spring',
        },
      ],
      events: [
        {
          frameIndex: 60,
          timestamp: 1000,
          eventType: 'click',
          cursor: { x: 500, y: 300 },
          viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
          scrollOffset: { x: 0, y: 0 },
          activeStickyRegions: [],
        },
      ],
    };

    // 1. Pack
    await DesktopFileManager.packProjectToFocalZip(mockProject, tempFocalPath);

    const exists = await fs.stat(tempFocalPath);
    expect(exists.size).toBeGreaterThan(100);

    // 2. Unpack
    const unpacked = await DesktopFileManager.unpackProjectFromFocalZip(tempFocalPath);

    expect(unpacked.id).toBe('proj-desktop-1');
    expect(unpacked.title).toBe('Desktop Test Project');
    expect(unpacked.springConfig.stiffness).toBe(220);
    expect(unpacked.keyframes.length).toBe(1);
    expect(unpacked.keyframes[0].zoomScale).toBe(2.0);
    expect(unpacked.events?.length).toBe(1);
    expect(unpacked.events?.[0].eventType).toBe('click');
  });
});
