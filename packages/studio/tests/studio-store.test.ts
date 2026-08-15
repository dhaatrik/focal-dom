import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../src/store/project-store';
import { usePlaybackStore } from '../src/store/playback-store';
import { useUIStore } from '../src/store/ui-store';
import { CameraKeyframe } from '@focaldom/core';
import { findMagneticSnapPoint } from '../src/hooks/useMagneticSnapping';

describe('FocalDOM Studio State Stores & Timeline Utilities', () => {
  beforeEach(() => {
    // Reset stores to default state
    useProjectStore.getState().setProject(useProjectStore.getState().project);
    usePlaybackStore.setState({
      currentTimeMs: 0,
      durationMs: 6000,
      isPlaying: false,
      playbackRate: 1.0,
      loop: true,
    });
    useUIStore.setState({
      selectedKeyframeId: null,
      activeInspectorTab: 'physics',
      timelineZoom: 100,
      isExportModalOpen: false,
    });
  });

  describe('ProjectStore & Undo/Redo & Split', () => {
    it('updates title and pushes to history stack', () => {
      const initialTitle = useProjectStore.getState().project.title;
      useProjectStore.getState().setTitle('New Demo Title');

      expect(useProjectStore.getState().project.title).toBe('New Demo Title');
      expect(useProjectStore.getState().history.length).toBe(1);

      // Undo
      useProjectStore.getState().undo();
      expect(useProjectStore.getState().project.title).toBe(initialTitle);
      expect(useProjectStore.getState().future.length).toBe(1);

      // Redo
      useProjectStore.getState().redo();
      expect(useProjectStore.getState().project.title).toBe('New Demo Title');
    });

    it('caps history stack at 50 steps during extensive editing', () => {
      for (let i = 0; i < 75; i++) {
        useProjectStore.getState().setTitle(`Title ${i}`);
      }
      expect(useProjectStore.getState().history.length).toBe(50);
    });

    it('splits a keyframe into two contiguous segments', () => {
      const newKf: CameraKeyframe = {
        id: 'kf-split-test',
        timestampMs: 1000,
        durationMs: 1000,
        zoomScale: 2.0,
        panOffset: { x: 0, y: 0 },
        easingCurve: 'spring',
        autoZoomGenerated: false,
      };

      useProjectStore.getState().addKeyframe(newKf);
      useProjectStore.getState().splitKeyframe('kf-split-test', 1400);

      const keyframes = useProjectStore.getState().project.keyframes;
      const kf1 = keyframes.find((k) => k.id === 'kf-split-test');
      expect(kf1).toBeDefined();
      expect(kf1?.durationMs).toBe(400);

      const kf2 = keyframes.find((k) => k.timestampMs === 1400);
      expect(kf2).toBeDefined();
      expect(kf2?.durationMs).toBe(600);
      expect(kf2?.zoomScale).toBe(2.0);
    });

    it('adds, updates, duplicates, and removes keyframes', () => {
      const newKf: CameraKeyframe = {
        id: 'kf-test-1',
        timestampMs: 1500,
        durationMs: 1000,
        zoomScale: 2.5,
        panOffset: { x: 50, y: 50 },
        easingCurve: 'easeInOutCubic',
        autoZoomGenerated: false,
      };

      useProjectStore.getState().addKeyframe(newKf);
      expect(useProjectStore.getState().project.keyframes.find((k) => k.id === 'kf-test-1')).toBeDefined();

      // Update zoom scale
      useProjectStore.getState().updateKeyframe('kf-test-1', { zoomScale: 3.0 });
      expect(useProjectStore.getState().project.keyframes.find((k) => k.id === 'kf-test-1')?.zoomScale).toBe(3.0);

      // Remove keyframe
      useProjectStore.getState().removeKeyframe('kf-test-1');
      expect(useProjectStore.getState().project.keyframes.find((k) => k.id === 'kf-test-1')).toBeUndefined();
    });

    it('updates spring physics and styling parameters', () => {
      useProjectStore.getState().updateSpringConfig({ stiffness: 300, damping: 35 });
      expect(useProjectStore.getState().project.springConfig.stiffness).toBe(300);
      expect(useProjectStore.getState().project.springConfig.damping).toBe(35);

      useProjectStore.getState().setAspectRatio('9:16');
      expect(useProjectStore.getState().project.aspectRatio).toBe('9:16');
    });
  });

  describe('Magnetic Snapping Utility', () => {
    it('snaps target timestamp when within pixel threshold distance', () => {
      const snapTargets = [0, 500, 1000, 2500];
      const zoom = 100; // 100px / sec => 1px = 10ms, 10px = 100ms threshold

      // Within 100ms of 500ms
      const snap1 = findMagneticSnapPoint(540, snapTargets, zoom, 10);
      expect(snap1.isSnapped).toBe(true);
      expect(snap1.snappedMs).toBe(500);

      // Outside threshold
      const snap2 = findMagneticSnapPoint(650, snapTargets, zoom, 10);
      expect(snap2.isSnapped).toBe(false);
      expect(snap2.snappedMs).toBe(650);
    });
  });

  describe('PlaybackStore', () => {
    it('manages play, pause, seek, and frame stepping', () => {
      const store = usePlaybackStore.getState();
      expect(store.isPlaying).toBe(false);

      store.play();
      expect(usePlaybackStore.getState().isPlaying).toBe(true);

      store.pause();
      expect(usePlaybackStore.getState().isPlaying).toBe(false);

      // Seek to 2500ms
      store.seek(2500);
      expect(usePlaybackStore.getState().currentTimeMs).toBe(2500);

      // Step 2 frames forward at 60fps (~33.33ms)
      store.stepFrame(2, 60);
      expect(Math.round(usePlaybackStore.getState().currentTimeMs)).toBe(2533);
    });
  });

  describe('UIStore', () => {
    it('manages active tab, selection, zoom, and export modal', () => {
      useUIStore.getState().setSelectedKeyframeId('kf-action');
      expect(useUIStore.getState().selectedKeyframeId).toBe('kf-action');
      expect(useUIStore.getState().activeInspectorTab).toBe('keyframe');

      useUIStore.getState().setTimelineZoom(200);
      expect(useUIStore.getState().timelineZoom).toBe(200);

      useUIStore.getState().setExportModalOpen(true);
      expect(useUIStore.getState().isExportModalOpen).toBe(true);
    });
  });
});
