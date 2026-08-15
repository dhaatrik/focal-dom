import { ipcMain, BrowserWindow, shell, dialog } from 'electron';
import path from 'node:path';
import { DesktopFileManager } from './file-manager';
import { DesktopFFmpegManager } from './ffmpeg-manager';
import { DesktopTelemetryServer } from './telemetry-server';
import { FocalDOMProject, DOMEventFrame } from '@focaldom/core';
import { PlatformInfo, ExportVideoOptions } from '../preload/types';

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

  // Export Video with real-time FFmpeg progress streaming
  ipcMain.handle('focal:export-video', async (_event, args: ExportVideoOptions) => {
    try {
      let outputPath = args.outputPath;

      // If no output path was provided, prompt user with Save Dialog
      if (!outputPath) {
        const result = await dialog.showSaveDialog(mainWindow, {
          title: 'Export Rendered Video',
          defaultPath: `${args.project.title || 'focal-render'}.mp4`,
          filters: [
            { name: 'MP4 Video (*.mp4)', extensions: ['mp4'] },
            { name: 'All Files (*.*)', extensions: ['*'] },
          ],
        });

        if (result.canceled || !result.filePath) {
          return { success: false, outputPath: '', error: 'Export canceled by user' };
        }
        outputPath = result.filePath;
      }

      const totalDurationMs = args.project.events?.length
        ? args.project.events[args.project.events.length - 1].timestamp
        : 6000;
      const totalFrames = Math.max(1, Math.round((totalDurationMs / 1000) * (args.fps || 60)));

      const streamer = await DesktopFFmpegManager.createStreamer({
        outputPath,
        totalFrames,
        preset: args.preset,
        onProgress: (progress) => {
          if (!mainWindow.isDestroyed()) {
            mainWindow.webContents.send('focal:export-progress', progress);
          }
        },
      });

      await streamer.start();
      return { success: true, outputPath };
    } catch (err: any) {
      return { success: false, outputPath: args.outputPath || '', error: err.message };
    }
  });

  // Show item in Windows Explorer / Finder
  ipcMain.handle('focal:show-item-in-folder', async (_event, filePath: string) => {
    if (filePath) {
      shell.showItemInFolder(path.resolve(filePath));
    }
  });

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
