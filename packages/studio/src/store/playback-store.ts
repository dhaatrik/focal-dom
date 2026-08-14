import { create } from 'zustand';

interface PlaybackState {
  currentTimeMs: number;
  durationMs: number;
  isPlaying: boolean;
  playbackRate: number;
  loop: boolean;

  // Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (timestampMs: number) => void;
  stepFrame: (deltaFrames: number, fps?: number) => void;
  setDuration: (durationMs: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleLoop: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  currentTimeMs: 0,
  durationMs: 6000, // Default 6 seconds demo
  isPlaying: false,
  playbackRate: 1.0,
  loop: true,

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  seek: (timestampMs) => {
    const { durationMs } = get();
    const clamped = Math.max(0, Math.min(durationMs, timestampMs));
    set({ currentTimeMs: clamped });
  },

  stepFrame: (deltaFrames, fps = 60) => {
    const { currentTimeMs, durationMs } = get();
    const frameMs = 1000 / fps;
    const targetMs = currentTimeMs + deltaFrames * frameMs;
    const clamped = Math.max(0, Math.min(durationMs, targetMs));
    set({ currentTimeMs: clamped, isPlaying: false });
  },

  setDuration: (durationMs) => set({ durationMs: Math.max(100, durationMs) }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  toggleLoop: () => set((state) => ({ loop: !state.loop })),
}));
