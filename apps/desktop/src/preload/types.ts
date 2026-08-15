import { FocalDOMProject, DOMEventFrame } from '@focaldom/core';
import { ExportPreset } from '@focaldom/renderer';

export interface ExportVideoOptions {
  project: FocalDOMProject;
  outputPath?: string;
  preset?: ExportPreset;
  fps?: number;
}

export interface ExportProgress {
  percent: number;
  frame: number;
  totalFrames: number;
  fps: number;
}

export interface PlatformInfo {
  platform: string;
  arch: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
}

export interface SaveProjectResult {
  success: boolean;
  filePath: string;
  error?: string;
}

export interface FocalDesktopAPI {
  openProject: () => Promise<{ project: FocalDOMProject; filePath: string } | null>;
  saveProject: (project: FocalDOMProject, filePath?: string) => Promise<SaveProjectResult>;
  saveProjectAs: (project: FocalDOMProject) => Promise<SaveProjectResult>;
  getFFmpegPath: () => Promise<string | null>;
  exportVideo: (options: ExportVideoOptions) => Promise<{ success: boolean; outputPath: string; error?: string }>;
  onExportProgress: (callback: (progress: ExportProgress) => void) => () => void;
  showItemInFolder: (filePath: string) => Promise<void>;
  onOpenFilePath: (callback: (filePath: string) => void) => () => void;
  onTelemetryEvent: (callback: (event: DOMEventFrame) => void) => () => void;
  getPlatformInfo: () => Promise<PlatformInfo>;
}

declare global {
  interface Window {
    focalApi?: FocalDesktopAPI;
  }
}
