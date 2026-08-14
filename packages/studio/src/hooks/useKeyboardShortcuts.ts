import { useEffect } from 'react';
import { usePlaybackStore } from '../store/playback-store';
import { useProjectStore } from '../store/project-store';
import { useUIStore } from '../store/ui-store';

export function useKeyboardShortcuts() {
  const togglePlay = usePlaybackStore((state) => state.togglePlay);
  const stepFrame = usePlaybackStore((state) => state.stepFrame);
  const selectedKeyframeId = useUIStore((state) => state.selectedKeyframeId);
  const setSelectedKeyframeId = useUIStore((state) => state.setSelectedKeyframeId);
  const removeKeyframe = useProjectStore((state) => state.removeKeyframe);
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
  }, [togglePlay, stepFrame, selectedKeyframeId, removeKeyframe, setSelectedKeyframeId, undo, redo]);
}
