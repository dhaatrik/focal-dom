import React from 'react';
import { usePlaybackStore } from '../../store/playback-store';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Gauge,
} from 'lucide-react';

export const PlaybackControls: React.FC = () => {
  const isPlaying = usePlaybackStore((state) => state.isPlaying);
  const currentTimeMs = usePlaybackStore((state) => state.currentTimeMs);
  const durationMs = usePlaybackStore((state) => state.durationMs);
  const playbackRate = usePlaybackStore((state) => state.playbackRate);
  const loop = usePlaybackStore((state) => state.loop);
  const togglePlay = usePlaybackStore((state) => state.togglePlay);
  const stepFrame = usePlaybackStore((state) => state.stepFrame);
  const setPlaybackRate = usePlaybackStore((state) => state.setPlaybackRate);
  const toggleLoop = usePlaybackStore((state) => state.toggleLoop);
  const seek = usePlaybackStore((state) => state.seek);

  const formatTimecode = (ms: number): string => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
  };

  return (
    <div className="playback-controls">
      {/* Reset to Start */}
      <button
        className="playback-btn"
        onClick={() => seek(0)}
        title="Rewind to Start"
      >
        <RotateCcw size={16} />
      </button>

      {/* Step Back 1 Frame */}
      <button
        className="playback-btn"
        onClick={() => stepFrame(-1)}
        title="Previous Frame (Left Arrow)"
      >
        <SkipBack size={16} />
      </button>

      {/* Main Play / Pause Toggle */}
      <button
        className="playback-btn play-pause-btn"
        onClick={togglePlay}
        title="Play / Pause (Space)"
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
      </button>

      {/* Step Forward 1 Frame */}
      <button
        className="playback-btn"
        onClick={() => stepFrame(1)}
        title="Next Frame (Right Arrow)"
      >
        <SkipForward size={16} />
      </button>

      {/* Timecode Readout */}
      <div className="timecode-display">
        <span className="current-time">{formatTimecode(currentTimeMs)}</span>
        <span className="time-separator">/</span>
        <span className="total-time">{formatTimecode(durationMs)}</span>
      </div>

      {/* Playback Rate Selector */}
      <div className="rate-selector">
        <Gauge size={14} className="text-slate-400" />
        <select
          value={playbackRate}
          onChange={(e) => setPlaybackRate(Number(e.target.value))}
          className="rate-select"
        >
          <option value="0.25">0.25x</option>
          <option value="0.5">0.5x</option>
          <option value="1">1.0x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2.0x</option>
        </select>
      </div>

      {/* Loop Toggle */}
      <button
        className={`playback-btn loop-btn ${loop ? 'active' : ''}`}
        onClick={toggleLoop}
        title="Toggle Loop"
      >
        Loop
      </button>
    </div>
  );
};
