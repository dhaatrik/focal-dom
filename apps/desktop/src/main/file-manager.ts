import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import AdmZip from 'adm-zip';
import { FocalDOMProject, DOMEventFrame } from '@focaldom/core';

export class DesktopFileManager {
  /**
   * Packages a FocalDOMProject, its DOM event stream, and local media into a .focal ZIP bundle.
   */
  static async packProjectToFocalZip(project: FocalDOMProject, outputPath: string): Promise<void> {
    const zip = new AdmZip();

    let bundledMediaName: string | undefined = undefined;

    // 1. If rawVideoPath is present and points to a local file, bundle it into media/
    if (project.rawVideoPath && existsSync(project.rawVideoPath)) {
      try {
        const mediaBuffer = await fs.readFile(project.rawVideoPath);
        bundledMediaName = path.basename(project.rawVideoPath);
        zip.addFile(`media/${bundledMediaName}`, mediaBuffer);
      } catch (err) {
        console.warn(`Could not bundle media file ${project.rawVideoPath}:`, err);
      }
    }

    // 2. Write project metadata and configuration
    const projectJson = JSON.stringify(
      {
        id: project.id,
        title: project.title,
        version: project.version,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        rawVideoPath: project.rawVideoPath,
        bundledMediaName,
        aspectRatio: project.aspectRatio,
        canvasPadding: project.canvasPadding,
        backgroundStyle: project.backgroundStyle,
        windowFrame: project.windowFrame,
        springConfig: project.springConfig,
        keyframes: project.keyframes,
      },
      null,
      2
    );
    zip.addFile('project.json', Buffer.from(projectJson, 'utf-8'));

    // 3. Write DOM event frames
    const eventsJson = JSON.stringify(project.events || [], null, 2);
    zip.addFile('events.json', Buffer.from(eventsJson, 'utf-8'));

    // Ensure directory exists and write ZIP file
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await zip.writeZipPromise(outputPath);
  }

  /**
   * Unpacks and rehydrates a FocalDOMProject from a .focal ZIP bundle, extracting bundled media if present.
   */
  static async unpackProjectFromFocalZip(sourcePath: string): Promise<FocalDOMProject> {
    if (!existsSync(sourcePath)) {
      throw new Error(`Project file does not exist: ${sourcePath}`);
    }

    const zip = new AdmZip(sourcePath);

    const projectEntry = zip.getEntry('project.json');
    if (!projectEntry) {
      throw new Error(`Invalid .focal archive: missing 'project.json' in ${sourcePath}`);
    }

    const projectData = JSON.parse(projectEntry.getData().toString('utf-8'));

    const eventsEntry = zip.getEntry('events.json');
    let events: DOMEventFrame[] = [];
    if (eventsEntry) {
      try {
        events = JSON.parse(eventsEntry.getData().toString('utf-8'));
      } catch {}
    }

    let rawVideoPath = projectData.rawVideoPath;

    // Check if media was bundled inside the archive
    const zipEntries = zip.getEntries();
    const mediaEntry = zipEntries.find(
      (entry) => entry.entryName.startsWith('media/') && !entry.isDirectory
    );

    if (mediaEntry) {
      const fileName = path.basename(mediaEntry.entryName);
      const cacheDir = path.join(os.tmpdir(), 'focaldom-media-cache', projectData.id || 'temp');
      await fs.mkdir(cacheDir, { recursive: true });
      const extractedPath = path.join(cacheDir, fileName);
      await fs.writeFile(extractedPath, mediaEntry.getData());
      rawVideoPath = extractedPath;
    }

    return {
      ...projectData,
      rawVideoPath,
      events,
    };
  }

  /**
   * Opens native Windows Open File dialog to pick and load a .focal project.
   */
  static async promptOpenProject(
    parentWindow?: any
  ): Promise<{ project: FocalDOMProject; filePath: string } | null> {
    let electronDialog: typeof import('electron').dialog | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      electronDialog = require('electron').dialog;
    } catch {
      return null;
    }

    if (!electronDialog) return null;

    const result = await electronDialog.showOpenDialog(parentWindow, {
      title: 'Open FocalDOM Project',
      filters: [
        { name: 'FocalDOM Project (*.focal)', extensions: ['focal'] },
        { name: 'All Files (*.*)', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    try {
      const project = await this.unpackProjectFromFocalZip(filePath);
      return { project, filePath };
    } catch (err: any) {
      console.error('Failed to open project:', err);
      return null;
    }
  }

  /**
   * Opens native Windows Save File dialog to save a .focal project.
   */
  static async promptSaveProject(
    project: FocalDOMProject,
    parentWindow?: any,
    defaultPath?: string
  ): Promise<{ success: boolean; filePath: string }> {
    let electronDialog: typeof import('electron').dialog | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      electronDialog = require('electron').dialog;
    } catch {
      return { success: false, filePath: '' };
    }

    if (!electronDialog) return { success: false, filePath: '' };

    const result = await electronDialog.showSaveDialog(parentWindow, {
      title: 'Save FocalDOM Project',
      defaultPath: defaultPath || `${project.title || 'Untitled'}.focal`,
      filters: [
        { name: 'FocalDOM Project (*.focal)', extensions: ['focal'] },
        { name: 'All Files (*.*)', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, filePath: '' };
    }

    await this.packProjectToFocalZip(project, result.filePath);
    return { success: true, filePath: result.filePath };
  }
}
