import React, { useEffect, useRef } from 'react';
import { useProjectStore } from '../../store/project-store';
import { usePlaybackStore } from '../../store/playback-store';
import { FocalPixiApp, RenderDimensions } from '@focaldom/renderer';

export const CanvasViewport: React.FC = () => {
  const project = useProjectStore((state) => state.project);
  const currentTimeMs = usePlaybackStore((state) => state.currentTimeMs);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<FocalPixiApp | null>(null);

  // Compute aspect ratio dimensions
  const getCanvasDimensions = (): { width: number; height: number } => {
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

  // Initialize Pixi Application once
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const baseDim = getCanvasDimensions();
    const dimensions: RenderDimensions = {
      width: baseDim.width,
      height: baseDim.height,
      aspectRatio: project.aspectRatio,
      devicePixelRatio: Math.min(2, window.devicePixelRatio || 1),
    };

    const app = new FocalPixiApp({
      dimensions,
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
  }, []);

  // Handle aspect ratio changes with zero-flicker dynamic resize
  useEffect(() => {
    if (appRef.current) {
      const baseDim = getCanvasDimensions();
      const dimensions: RenderDimensions = {
        width: baseDim.width,
        height: baseDim.height,
        aspectRatio: project.aspectRatio,
        devicePixelRatio: Math.min(2, window.devicePixelRatio || 1),
      };
      appRef.current.resize(dimensions, project);
      appRef.current.renderFrame(currentTimeMs);
    }
  }, [project.aspectRatio]);

  // Update canvas on time or project changes
  useEffect(() => {
    if (appRef.current) {
      appRef.current.renderFrame(currentTimeMs);
    }
  }, [currentTimeMs, project]);

  // Responsive ResizeObserver for viewport bounds
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (appRef.current) {
        appRef.current.renderFrame(currentTimeMs);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [currentTimeMs]);

  return (
    <div ref={containerRef} className="canvas-viewport-container">
      <div className="canvas-frame-wrapper">
        <canvas ref={canvasRef} className="preview-canvas" />
      </div>
    </div>
  );
};
