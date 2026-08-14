import { contextBridge, ipcRenderer } from 'electron';
import { FocalDesktopAPI, ExportVideoOptions } from './types';
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
