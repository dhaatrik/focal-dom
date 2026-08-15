import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../src/store/project-store';
import { usePlaybackStore } from '../src/store/playback-store';
import { useUIStore } from '../src/store/ui-store';
import { CameraKeyframe } from '@focaldom/core';

describe('FocalDOM Studio State Stores', () => {
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

  describe('ProjectStore & Undo/Redo', () => {
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
