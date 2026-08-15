import { create } from 'zustand';
import { FocalDOMProject, CameraKeyframe, SpringConfig, AspectRatio } from '@focaldom/core';
import { createDefaultProject } from './default-project';

const MAX_HISTORY_STEPS = 50;

interface ProjectState {
  project: FocalDOMProject;
  history: FocalDOMProject[];
  future: FocalDOMProject[];

  // Actions
  setProject: (project: FocalDOMProject) => void;
  setTitle: (title: string) => void;
  setAspectRatio: (aspectRatio: AspectRatio) => void;
  updateSpringConfig: (config: Partial<SpringConfig>) => void;
  updateWindowFrame: (frame: Partial<FocalDOMProject['windowFrame']>) => void;
  updateBackgroundStyle: (bg: Partial<FocalDOMProject['backgroundStyle']>) => void;

  // Keyframe CRUD & Split
  addKeyframe: (keyframe: CameraKeyframe) => void;
  updateKeyframe: (id: string, updates: Partial<CameraKeyframe>) => void;
  removeKeyframe: (id: string) => void;
  duplicateKeyframe: (id: string) => void;
  splitKeyframe: (id: string, splitTimestampMs: number) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: createDefaultProject(),
  history: [],
  future: [],

  setProject: (project) => {
    set({ project, history: [], future: [] });
  },

  setTitle: (title) => {
    const { project, history } = get();
    set({
      history: [...history, project].slice(-MAX_HISTORY_STEPS),
      future: [],
      project: { ...project, title, updatedAt: Date.now() },
    });
  },

  setAspectRatio: (aspectRatio) => {
    const { project, history } = get();
    set({
      history: [...history, project].slice(-MAX_HISTORY_STEPS),
      future: [],
      project: { ...project, aspectRatio, updatedAt: Date.now() },
    });
  },

  updateSpringConfig: (config) => {
    const { project, history } = get();
    set({
      history: [...history, project].slice(-MAX_HISTORY_STEPS),
      future: [],
      project: {
        ...project,
        springConfig: { ...project.springConfig, ...config },
        updatedAt: Date.now(),
      },
    });
  },

  updateWindowFrame: (frame) => {
    const { project, history } = get();
    set({
      history: [...history, project].slice(-MAX_HISTORY_STEPS),
      future: [],
      project: {
        ...project,
        windowFrame: { ...project.windowFrame, ...frame },
        updatedAt: Date.now(),
      },
    });
  },

  updateBackgroundStyle: (bg) => {
    const { project, history } = get();
    set({
      history: [...history, project].slice(-MAX_HISTORY_STEPS),
      future: [],
      project: {
        ...project,
        backgroundStyle: { ...project.backgroundStyle, ...bg },
        updatedAt: Date.now(),
      },
    });
  },

  addKeyframe: (keyframe) => {
    const { project, history } = get();
    const sorted = [...project.keyframes, keyframe].sort((a, b) => a.timestampMs - b.timestampMs);
    set({
      history: [...history, project].slice(-MAX_HISTORY_STEPS),
      future: [],
      project: { ...project, keyframes: sorted, updatedAt: Date.now() },
    });
  },

  updateKeyframe: (id, updates) => {
    const { project, history } = get();
    const updatedKeyframes = project.keyframes
      .map((kf) => (kf.id === id ? { ...kf, ...updates } : kf))
      .sort((a, b) => a.timestampMs - b.timestampMs);
    set({
      history: [...history, project].slice(-MAX_HISTORY_STEPS),
      future: [],
      project: { ...project, keyframes: updatedKeyframes, updatedAt: Date.now() },
    });
  },

  removeKeyframe: (id) => {
    const { project, history } = get();
    set({
      history: [...history, project].slice(-MAX_HISTORY_STEPS),
      future: [],
      project: {
        ...project,
        keyframes: project.keyframes.filter((kf) => kf.id !== id),
        updatedAt: Date.now(),
      },
    });
  },

  duplicateKeyframe: (id) => {
    const { project, history } = get();
    const target = project.keyframes.find((kf) => kf.id === id);
    if (!target) return;

    const newKeyframe: CameraKeyframe = {
      ...target,
      id: `kf-${Date.now()}`,
      timestampMs: target.timestampMs + target.durationMs + 200,
    };

    const sorted = [...project.keyframes, newKeyframe].sort((a, b) => a.timestampMs - b.timestampMs);
    set({
      history: [...history, project].slice(-MAX_HISTORY_STEPS),
      future: [],
      project: { ...project, keyframes: sorted, updatedAt: Date.now() },
    });
  },

  splitKeyframe: (id, splitTimestampMs) => {
    const { project, history } = get();
    const target = project.keyframes.find((kf) => kf.id === id);
    if (!target) return;

    // Check if split point is inside the keyframe with minimum margin
    const minMargin = 50;
    if (
      splitTimestampMs <= target.timestampMs + minMargin ||
      splitTimestampMs >= target.timestampMs + target.durationMs - minMargin
    ) {
      return;
    }

    const firstDuration = splitTimestampMs - target.timestampMs;
    const secondDuration = target.durationMs - firstDuration;

    const kf1: CameraKeyframe = {
      ...target,
      durationMs: firstDuration,
    };

    const kf2: CameraKeyframe = {
      ...target,
      id: `kf-${Date.now()}`,
      timestampMs: splitTimestampMs,
      durationMs: secondDuration,
    };

    const updatedKeyframes = project.keyframes
      .flatMap((kf) => (kf.id === id ? [kf1, kf2] : [kf]))
      .sort((a, b) => a.timestampMs - b.timestampMs);

    set({
      history: [...history, project].slice(-MAX_HISTORY_STEPS),
      future: [],
      project: { ...project, keyframes: updatedKeyframes, updatedAt: Date.now() },
    });
  },

  undo: () => {
    const { project, history, future } = get();
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    set({
      project: previous,
      history: history.slice(0, -1),
      future: [project, ...future].slice(0, MAX_HISTORY_STEPS),
    });
  },

  redo: () => {
    const { project, history, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      project: next,
      history: [...history, project].slice(-MAX_HISTORY_STEPS),
      future: future.slice(1),
    });
  },
}));
