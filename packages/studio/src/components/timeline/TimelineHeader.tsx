import React, { useRef } from 'react';
import { usePlaybackStore } from '../../store/playback-store';
import { useUIStore } from '../../store/ui-store';

export const TimelineHeader: React.FC = () => {
  const durationMs = usePlaybackStore((state) => state.durationMs);
  const currentTimeMs = usePlaybackStore((state) => state.currentTimeMs);
  const seek = usePlaybackStore((state) => state.seek);
  const timelineZoom = useUIStore((state) => state.timelineZoom);

  const rulerRef = useRef<HTMLDivElement>(null);

  const totalWidthPx = (durationMs / 1000) * timelineZoom;
  const playheadPositionPx = (currentTimeMs / 1000) * timelineZoom;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const targetTimestampMs = (offsetX / timelineZoom) * 1000;
    seek(targetTimestampMs);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const moveOffsetX = moveEvent.clientX - rect.left;
      seek((moveOffsetX / timelineZoom) * 1000);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Generate tick marks (e.g. every 1s major, every 500ms minor)
  const totalSeconds = Math.ceil(durationMs / 1000);
  const tickElements = [];

  for (let s = 0; s <= totalSeconds; s++) {
    const leftPx = s * timelineZoom;
    tickElements.push(
      <div
        key={`sec-${s}`}
        className="timeline-tick major"
        style={{ left: `${leftPx}px` }}
      >
        <span className="timeline-tick-label">{s}s</span>
      </div>
    );

    // Half-second minor tick
    if (s < totalSeconds) {
      tickElements.push(
        <div
          key={`half-${s}`}
          className="timeline-tick minor"
          style={{ left: `${leftPx + timelineZoom / 2}px` }}
        />
      );
    }
  }

  return (
    <div
      ref={rulerRef}
      className="timeline-ruler"
      style={{ width: `${Math.max(600, totalWidthPx)}px` }}
      onPointerDown={handlePointerDown}
    >
      {tickElements}

      {/* Red Playhead Marker */}
      <div
        className="timeline-playhead"
        style={{ transform: `translateX(${playheadPositionPx}px)` }}
      >
        <div className="timeline-playhead-handle" />
        <div className="timeline-playhead-line" />
      </div>
    </div>
  );
};
