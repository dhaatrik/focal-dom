import React, { useEffect, useRef } from 'react';
import { useProjectStore } from '../../store/project-store';
import { usePlaybackStore } from '../../store/playback-store';
import { FocalPixiApp } from '@focaldom/renderer';

export const CanvasViewport: React.FC = () => {
  const project = useProjectStore((state) => state.project);
  const currentTimeMs = usePlaybackStore((state) => state.currentTimeMs);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<FocalPixiApp | null>(null);

  // Compute aspect ratio dimensions
  const getCanvasDimensions = () => {
    switch (project.aspectRatio) {
      case '9:16':
        return { width: 1080, height: 1920 };
      case '1:1':
        return { width: 1080, height: 1080 };
      case '4:3':
        return { width: 1440, height: 1080 };
      case '16:9':
      default:
        return { width: 1920, height: 1080 };
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const dimensions = getCanvasDimensions();
    const app = new FocalPixiApp({
      dimensions: {
        width: dimensions.width,
        height: dimensions.height,
        aspectRatio: project.aspectRatio,
        devicePixelRatio: Math.min(2, window.devicePixelRatio || 1),
      },
      project,
      enableMotionBlur: true,
    });

    app.init(canvasRef.current).then(() => {
      appRef.current = app;
      app.renderFrame(currentTimeMs);
    });

    return () => {
      if (appRef.current) {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, [project.aspectRatio]);

  // Update canvas on time or project changes
  useEffect(() => {
    if (appRef.current) {
      appRef.current.renderFrame(currentTimeMs);
    }
  }, [currentTimeMs, project]);

  return (
    <div ref={containerRef} className="canvas-viewport-container">
      <div className="canvas-frame-wrapper">
        <canvas ref={canvasRef} className="preview-canvas" />
      </div>
    </div>
  );
};
