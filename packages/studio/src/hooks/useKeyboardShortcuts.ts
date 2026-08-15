import { useEffect } from 'react';
import { usePlaybackStore } from '../store/playback-store';
import { useProjectStore } from '../store/project-store';
import { useUIStore } from '../store/ui-store';

export function useKeyboardShortcuts() {
  const togglePlay = usePlaybackStore((state) => state.togglePlay);
  const isPlaying = usePlaybackStore((state) => state.isPlaying);
  const pause = usePlaybackStore((state) => state.pause);
  const play = usePlaybackStore((state) => state.play);
  const stepFrame = usePlaybackStore((state) => state.stepFrame);
  const seek = usePlaybackStore((state) => state.seek);
  const currentTimeMs = usePlaybackStore((state) => state.currentTimeMs);
  const durationMs = usePlaybackStore((state) => state.durationMs);

  const selectedKeyframeId = useUIStore((state) => state.selectedKeyframeId);
  const setSelectedKeyframeId = useUIStore((state) => state.setSelectedKeyframeId);
  const removeKeyframe = useProjectStore((state) => state.removeKeyframe);
  const splitKeyframe = useProjectStore((state) => state.splitKeyframe);
  const undo = useProjectStore((state) => state.undo);
  const redo = useProjectStore((state) => state.redo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes when typing in text inputs or textareas
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Space: Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        return;
      }

      // S key: Split selected keyframe at current playhead position
      if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
        if (selectedKeyframeId) {
          e.preventDefault();
          splitKeyframe(selectedKeyframeId, currentTimeMs);
        }
        return;
      }

      // Home: Seek to 0ms
      if (e.code === 'Home') {
        e.preventDefault();
        seek(0);
        return;
      }

      // End: Seek to end
      if (e.code === 'End') {
        e.preventDefault();
        seek(durationMs);
        return;
      }

      // J / K / L Shuttle keys
      if (e.code === 'KeyJ' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        stepFrame(-5);
        return;
      }

      if (e.code === 'KeyK' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        pause();
        return;
      }

      if (e.code === 'KeyL' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (!isPlaying) {
          play();
        } else {
          stepFrame(5);
        }
        return;
      }

      // Arrow Left / Right: Frame step
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepFrame(e.shiftKey ? -10 : -1);
        return;
      }

      if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepFrame(e.shiftKey ? 10 : 1);
        return;
      }

      // Delete / Backspace: Remove selected keyframe
      if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedKeyframeId) {
          e.preventDefault();
          removeKeyframe(selectedKeyframeId);
          setSelectedKeyframeId(null);
        }
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y / Cmd+Shift+Z / Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyZ')
      ) {
        e.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    isPlaying,
    pause,
    play,
    stepFrame,
    seek,
    currentTimeMs,
    durationMs,
    selectedKeyframeId,
    removeKeyframe,
    splitKeyframe,
    setSelectedKeyframeId,
    undo,
    redo,
  ]);
}
