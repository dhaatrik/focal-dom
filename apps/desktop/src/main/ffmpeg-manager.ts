import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { FFmpegStreamer, ExportPreset, EXPORT_PRESETS, ExportProgressCallback } from '@focaldom/renderer';

export class DesktopFFmpegManager {
  private static cachedPath: string | null = null;

  /**
   * Resolves the path to the static bundled ffmpeg.exe or system PATH executable.
   */
  static async resolveFFmpegPath(): Promise<string> {
    if (this.cachedPath) {
      return this.cachedPath;
    }

    let electronApp: typeof import('electron').app | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      electronApp = require('electron').app;
    } catch {
      // Running in unit test or non-electron node process
    }

    const isPackaged = electronApp ? electronApp.isPackaged : process.env.NODE_ENV === 'production';
    const isWindows = process.platform === 'win32';
    const binaryName = isWindows ? 'ffmpeg.exe' : 'ffmpeg';

    const candidatePaths: string[] = [];

    if (isPackaged && electronApp) {
      // 1. Packaged Electron extraResources directory
      candidatePaths.push(path.join(process.resourcesPath, 'bin', binaryName));
      candidatePaths.push(path.join(process.resourcesPath, binaryName));
    }

    // 2. Development project resources directory
    candidatePaths.push(path.join(process.cwd(), 'resources', 'bin', binaryName));
    candidatePaths.push(path.join(process.cwd(), 'resources', binaryName));

    for (const candidate of candidatePaths) {
      try {
        await fs.access(candidate);
        this.cachedPath = candidate;
        return candidate;
      } catch {
        // Continue searching
      }
    }

    // 3. Fallback to system PATH (with 3000ms timeout guard)
    const systemExecutable = await this.testSystemExecutable(binaryName, 3000);
    if (systemExecutable) {
      this.cachedPath = systemExecutable;
      return systemExecutable;
    }

    // Fallback name
    this.cachedPath = binaryName;
    return binaryName;
  }

  /**
   * Tests if the executable runs successfully from system PATH with a timeout guard.
   */
  private static testSystemExecutable(executable: string, timeoutMs: number = 3000): Promise<string | null> {
    return new Promise((resolve) => {
      let isResolved = false;

      let proc: any;
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          if (proc) {
            try {
              proc.kill();
            } catch {}
          }
          resolve(null);
        }
      }, timeoutMs);

      try {
        proc = spawn(executable, ['-version']);
        proc.on('error', () => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeout);
            resolve(null);
          }
        });
        proc.on('close', (code: number) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeout);
            resolve(code === 0 ? executable : null);
          }
        });
      } catch {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          resolve(null);
        }
      }
    });
  }

  /**
   * Spawns an FFmpegStreamer configured with the resolved binary.
   */
  static async createStreamer(options: {
    outputPath: string;
    totalFrames: number;
    preset?: ExportPreset;
    onProgress?: ExportProgressCallback;
  }): Promise<FFmpegStreamer> {
    const ffmpegPath = await this.resolveFFmpegPath();
    return new FFmpegStreamer({
      preset: options.preset ?? EXPORT_PRESETS.youtube4k,
      outputPath: options.outputPath,
      totalFrames: options.totalFrames,
      ffmpegPath,
      onProgress: options.onProgress,
    });
  }
}
