import { ipcMain, BrowserWindow } from 'electron';
import { DesktopFileManager } from './file-manager';
import { DesktopFFmpegManager } from './ffmpeg-manager';
import { DesktopTelemetryServer } from './telemetry-server';
import { FocalDOMProject, DOMEventFrame } from '@focaldom/core';
import { PlatformInfo } from '../preload/types';

export function registerIpcHandlers(
  mainWindow: BrowserWindow,
  telemetryServer: DesktopTelemetryServer
) {
  // Open Project
  ipcMain.handle('focal:open-project', async () => {
    return await DesktopFileManager.promptOpenProject(mainWindow);
  });

  // Save Project
  ipcMain.handle(
    'focal:save-project',
    async (_event, args: { project: FocalDOMProject; filePath?: string }) => {
      if (!args.filePath) {
        return await DesktopFileManager.promptSaveProject(args.project, mainWindow);
      }
      try {
        await DesktopFileManager.packProjectToFocalZip(args.project, args.filePath);
        return { success: true, filePath: args.filePath };
      } catch (err: any) {
        return { success: false, filePath: args.filePath, error: err.message };
      }
    }
  );

  // Save Project As
  ipcMain.handle(
    'focal:save-project-as',
    async (_event, args: { project: FocalDOMProject }) => {
      return await DesktopFileManager.promptSaveProject(args.project, mainWindow);
    }
  );

  // Resolve FFmpeg Path
  ipcMain.handle('focal:get-ffmpeg-path', async () => {
    return await DesktopFFmpegManager.resolveFFmpegPath();
  });

  // Export Video
  ipcMain.handle(
    'focal:export-video',
    async (_event, args: { project: FocalDOMProject; outputPath: string; preset?: any; fps?: number }) => {
      try {
        const totalDurationMs = args.project.events?.length
          ? args.project.events[args.project.events.length - 1].timestamp
          : 6000;
        const totalFrames = Math.max(1, Math.round((totalDurationMs / 1000) * (args.fps || 60)));
        const streamer = await DesktopFFmpegManager.createStreamer({
          outputPath: args.outputPath,
          totalFrames,
          preset: args.preset,
        });
        await streamer.start();
        return { success: true, outputPath: args.outputPath };
      } catch (err: any) {
        return { success: false, outputPath: args.outputPath, error: err.message };
      }
    }
  );

  // Platform & Environment Info
  ipcMain.handle('focal:get-platform-info', (): PlatformInfo => {
    return {
      platform: process.platform,
      arch: process.arch,
      electronVersion: process.versions.electron || '',
      chromeVersion: process.versions.chrome || '',
      nodeVersion: process.versions.node || '',
    };
  });

  // Forward Mode A live extension telemetry to renderer
  telemetryServer.on('event-frame', (frame: DOMEventFrame) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('focal:telemetry-event', frame);
    }
  });
}
