import { useEffect, useRef } from 'react';
import { usePlaybackStore } from '../store/playback-store';

export function usePlaybackLoop() {
  const isPlaying = usePlaybackStore((state) => state.isPlaying);
  const currentTimeMs = usePlaybackStore((state) => state.currentTimeMs);
  const durationMs = usePlaybackStore((state) => state.durationMs);
  const playbackRate = usePlaybackStore((state) => state.playbackRate);
  const loop = usePlaybackStore((state) => state.loop);
  const seek = usePlaybackStore((state) => state.seek);
  const pause = usePlaybackStore((state) => state.pause);

  const lastFrameTimeRef = useRef<number>(0);
  const isPlayingRef = useRef(isPlaying);
  const currentTimeRef = useRef(currentTimeMs);
  const durationRef = useRef(durationMs);
  const playbackRateRef = useRef(playbackRate);
  const loopRef = useRef(loop);

  isPlayingRef.current = isPlaying;
  currentTimeRef.current = currentTimeMs;
  durationRef.current = durationMs;
  playbackRateRef.current = playbackRate;
  loopRef.current = loop;

  useEffect(() => {
    let animationFrameId: number;

    const loopStep = (now: number) => {
      if (lastFrameTimeRef.current > 0 && isPlayingRef.current) {
        const deltaMs = (now - lastFrameTimeRef.current) * playbackRateRef.current;
        let nextTime = currentTimeRef.current + deltaMs;

        if (nextTime >= durationRef.current) {
          if (loopRef.current) {
            nextTime = 0;
          } else {
            nextTime = durationRef.current;
            pause();
          }
        }

        seek(nextTime);
      }

      lastFrameTimeRef.current = now;
      if (isPlayingRef.current) {
        animationFrameId = requestAnimationFrame(loopStep);
      }
    };

    if (isPlaying) {
      lastFrameTimeRef.current = performance.now();
      animationFrameId = requestAnimationFrame(loopStep);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, seek, pause]);
}
