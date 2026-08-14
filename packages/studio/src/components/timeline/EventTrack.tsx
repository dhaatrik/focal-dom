import React from 'react';
import { useProjectStore } from '../../store/project-store';
import { useUIStore } from '../../store/ui-store';
import { usePlaybackStore } from '../../store/playback-store';
import { MousePointer, Type, Scroll, Hand } from 'lucide-react';
import { DOMEventType } from '@focaldom/core';

export const EventTrack: React.FC = () => {
  const events = useProjectStore((state) => state.project.events || []);
  const timelineZoom = useUIStore((state) => state.timelineZoom);
  const seek = usePlaybackStore((state) => state.seek);

  const getEventIcon = (type: DOMEventType) => {
    switch (type) {
      case 'click':
        return <MousePointer size={12} className="text-blue-400" />;
      case 'input':
        return <Type size={12} className="text-emerald-400" />;
      case 'scroll':
        return <Scroll size={12} className="text-amber-400" />;
      default:
        return <Hand size={12} className="text-purple-400" />;
    }
  };

  return (
    <div className="timeline-track event-track">
      {events.map((ev, idx) => {
        const leftPx = (ev.timestamp / 1000) * timelineZoom;
        const targetInfo = ev.targetElement
          ? `${ev.targetElement.tagName}${ev.targetElement.id ? `#${ev.targetElement.id}` : ''}`
          : `(${ev.cursor.x}, ${ev.cursor.y})`;

        return (
          <div
            key={`event-${idx}`}
            className={`event-marker event-${ev.eventType}`}
            style={{ left: `${leftPx}px` }}
            onClick={() => seek(ev.timestamp)}
            title={`${ev.eventType.toUpperCase()} at ${ev.timestamp}ms: ${targetInfo}`}
          >
            {getEventIcon(ev.eventType)}
          </div>
        );
      })}
    </div>
  );
};
