import React, { useRef } from 'react';
import { TimelineHeader } from './TimelineHeader';
import { KeyframeTrack } from './KeyframeTrack';
import { EventTrack } from './EventTrack';
import { CursorTrack } from './CursorTrack';
import { useUIStore } from '../../store/ui-store';
import { usePlaybackStore } from '../../store/playback-store';
import { ZoomIn, ZoomOut, Layers, Video, MousePointer, Activity } from 'lucide-react';

export const TimelineContainer: React.FC = () => {
  const timelineZoom = useUIStore((state) => state.timelineZoom);
  const setTimelineZoom = useUIStore((state) => state.setTimelineZoom);
  const durationMs = usePlaybackStore((state) => state.durationMs);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const totalWidthPx = Math.max(800, (durationMs / 1000) * timelineZoom + 100);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      // Zoom centered around scroll
      const zoomDelta = e.deltaY < 0 ? 15 : -15;
      const newZoom = Math.min(600, Math.max(30, timelineZoom + zoomDelta));
      setTimelineZoom(newZoom);
    } else if (e.shiftKey) {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  return (
    <div className="timeline-panel">
      {/* Timeline Controls Toolbar */}
      <div className="timeline-toolbar">
        <div className="timeline-toolbar-left">
          <Layers size={16} className="text-slate-400" />
          <span className="timeline-title">Multi-Track NLE Timeline</span>
        </div>

        <div className="timeline-zoom-controls">
          <button
            className="timeline-zoom-btn"
            onClick={() => setTimelineZoom(Math.max(30, timelineZoom - 20))}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <input
            type="range"
            min="30"
            max="600"
            value={timelineZoom}
            onChange={(e) => setTimelineZoom(Number(e.target.value))}
            className="timeline-zoom-slider"
          />
          <button
            className="timeline-zoom-btn"
            onClick={() => setTimelineZoom(Math.min(600, timelineZoom + 20))}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Main Multi-Track Scroll Area */}
      <div className="timeline-body">
        {/* Track Label Sidebar */}
        <div className="timeline-track-labels">
          <div className="track-label-header">Tracks</div>
          <div className="track-label">
            <Video size={14} className="text-blue-400" />
            <span>Camera Zooms</span>
          </div>
          <div className="track-label">
            <Activity size={14} className="text-emerald-400" />
            <span>DOM Events</span>
          </div>
          <div className="track-label">
            <MousePointer size={14} className="text-amber-400" />
            <span>Cursor & Ripples</span>
          </div>
        </div>

        {/* Tracks Content Area */}
        <div
          ref={scrollAreaRef}
          className="timeline-scroll-area"
          onWheel={handleWheel}
        >
          <div className="timeline-tracks-content" style={{ width: `${totalWidthPx}px` }}>
            <TimelineHeader />
            <KeyframeTrack />
            <EventTrack />
            <CursorTrack />
          </div>
        </div>
      </div>
    </div>
  );
};
