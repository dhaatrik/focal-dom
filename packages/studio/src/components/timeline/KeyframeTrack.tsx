import React from 'react';
import { useProjectStore } from '../../store/project-store';
import { useUIStore } from '../../store/ui-store';
import { usePlaybackStore } from '../../store/playback-store';
import { CameraKeyframe } from '@focaldom/core';
import { ZoomIn } from 'lucide-react';

export const KeyframeTrack: React.FC = () => {
  const keyframes = useProjectStore((state) => state.project.keyframes);
  const updateKeyframe = useProjectStore((state) => state.updateKeyframe);
  const selectedKeyframeId = useUIStore((state) => state.selectedKeyframeId);
  const setSelectedKeyframeId = useUIStore((state) => state.setSelectedKeyframeId);
  const timelineZoom = useUIStore((state) => state.timelineZoom);
  const seek = usePlaybackStore((state) => state.seek);

  const handleBlockPointerDown = (e: React.PointerEvent, kf: CameraKeyframe) => {
    e.stopPropagation();
    setSelectedKeyframeId(kf.id);
    seek(kf.timestampMs);

    const startX = e.clientX;
    const initialStartMs = kf.timestampMs;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaPx = moveEvent.clientX - startX;
      const deltaMs = (deltaPx / timelineZoom) * 1000;
      const newTimestampMs = Math.max(0, initialStartMs + deltaMs);
      updateKeyframe(kf.id, { timestampMs: Math.round(newTimestampMs) });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleResizeRight = (e: React.PointerEvent, kf: CameraKeyframe) => {
    e.stopPropagation();
    const startX = e.clientX;
    const initialDuration = kf.durationMs;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaPx = moveEvent.clientX - startX;
      const deltaMs = (deltaPx / timelineZoom) * 1000;
      const newDuration = Math.max(200, initialDuration + deltaMs);
      updateKeyframe(kf.id, { durationMs: Math.round(newDuration) });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div className="timeline-track keyframe-track">
      {keyframes.map((kf) => {
        const leftPx = (kf.timestampMs / 1000) * timelineZoom;
        const widthPx = (kf.durationMs / 1000) * timelineZoom;
        const isSelected = selectedKeyframeId === kf.id;

        return (
          <div
            key={kf.id}
            className={`keyframe-block ${isSelected ? 'selected' : ''}`}
            style={{
              left: `${leftPx}px`,
              width: `${Math.max(24, widthPx)}px`,
            }}
            onPointerDown={(e) => handleBlockPointerDown(e, kf)}
          >
            <div className="keyframe-block-content">
              <ZoomIn size={14} className="keyframe-icon" />
              <span className="keyframe-label">{kf.zoomScale.toFixed(1)}x Zoom</span>
            </div>

            {/* Resize Handle Right */}
            <div
              className="keyframe-resize-handle right"
              onPointerDown={(e) => handleResizeRight(e, kf)}
            />
          </div>
        );
      })}
    </div>
  );
};
