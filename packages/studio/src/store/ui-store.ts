import { create } from 'zustand';

export type InspectorTab = 'physics' | 'styling' | 'keyframe';

interface UIState {
  selectedKeyframeId: string | null;
  activeInspectorTab: InspectorTab;
  timelineZoom: number; // Pixels per second (e.g. 50 - 500)
  isExportModalOpen: boolean;

  // Actions
  setSelectedKeyframeId: (id: string | null) => void;
  setActiveInspectorTab: (tab: InspectorTab) => void;
  setTimelineZoom: (zoom: number) => void;
  setExportModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedKeyframeId: null,
  activeInspectorTab: 'physics',
  timelineZoom: 100, // 100px = 1 second
  isExportModalOpen: false,

  setSelectedKeyframeId: (selectedKeyframeId) => {
    set({
      selectedKeyframeId,
      activeInspectorTab: selectedKeyframeId ? 'keyframe' : 'physics',
    });
  },
  setActiveInspectorTab: (activeInspectorTab) => set({ activeInspectorTab }),
  setTimelineZoom: (timelineZoom) => set({ timelineZoom: Math.max(30, Math.min(600, timelineZoom)) }),
  setExportModalOpen: (isExportModalOpen) => set({ isExportModalOpen }),
}));
