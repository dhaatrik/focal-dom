import React from 'react';
import { useProjectStore } from '../../store/project-store';
import { useUIStore } from '../../store/ui-store';

export const CursorTrack: React.FC = () => {
  const events = useProjectStore((state) => state.project.events || []);
  const timelineZoom = useUIStore((state) => state.timelineZoom);

  return (
    <div className="timeline-track cursor-track">
      {events
        .filter((e) => e.eventType === 'click')
        .map((ev, idx) => {
          const leftPx = (ev.timestamp / 1000) * timelineZoom;
          return (
            <div
              key={`ripple-${idx}`}
              className="cursor-ripple-marker"
              style={{ left: `${leftPx}px` }}
              title={`Click Ripple at ${ev.timestamp}ms`}
            />
          );
        })}
    </div>
  );
};
