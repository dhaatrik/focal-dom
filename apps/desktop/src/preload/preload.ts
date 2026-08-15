import { contextBridge, ipcRenderer } from 'electron';
import { FocalDesktopAPI, ExportVideoOptions, ExportProgress } from './types';
import { FocalDOMProject, DOMEventFrame } from '@focaldom/core';

const focalApi: FocalDesktopAPI = {
  openProject: () => ipcRenderer.invoke('focal:open-project'),
  saveProject: (project: FocalDOMProject, filePath?: string) =>
    ipcRenderer.invoke('focal:save-project', { project, filePath }),
  saveProjectAs: (project: FocalDOMProject) =>
    ipcRenderer.invoke('focal:save-project-as', { project }),
  getFFmpegPath: () => ipcRenderer.invoke('focal:get-ffmpeg-path'),
  exportVideo: (options: ExportVideoOptions) =>
    ipcRenderer.invoke('focal:export-video', options),
  onExportProgress: (callback: (progress: ExportProgress) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: ExportProgress) => callback(data);
    ipcRenderer.on('focal:export-progress', handler);
    return () => {
      ipcRenderer.removeListener('focal:export-progress', handler);
    };
  },
  showItemInFolder: (filePath: string) =>
    ipcRenderer.invoke('focal:show-item-in-folder', filePath),
  onOpenFilePath: (callback: (filePath: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, filePath: string) => callback(filePath);
    ipcRenderer.on('focal:open-file-path', handler);
    return () => {
      ipcRenderer.removeListener('focal:open-file-path', handler);
    };
  },
  onTelemetryEvent: (callback: (event: DOMEventFrame) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: DOMEventFrame) => callback(data);
    ipcRenderer.on('focal:telemetry-event', handler);
    return () => {
      ipcRenderer.removeListener('focal:telemetry-event', handler);
    };
  },
  getPlatformInfo: () => ipcRenderer.invoke('focal:get-platform-info'),
};

contextBridge.exposeInMainWorld('focalApi', focalApi);
