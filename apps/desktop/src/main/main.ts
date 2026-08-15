import { app, BrowserWindow, screen } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { registerIpcHandlers } from './ipc-handlers';
import { DesktopTelemetryServer } from './telemetry-server';

// Configure hardware acceleration and GPU switches
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized?: boolean;
}

let mainWindow: BrowserWindow | null = null;
let telemetryServer: DesktopTelemetryServer | null = null;

const STATE_FILE_NAME = 'window-state.json';

function getWindowStatePath(): string {
  return path.join(app.getPath('userData'), STATE_FILE_NAME);
}

function loadWindowState(): WindowState {
  const defaultState: WindowState = {
    width: 1440,
    height: 900,
  };

  try {
    const statePath = getWindowStatePath();
    if (fs.existsSync(statePath)) {
      const data = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      // Validate bounds against active displays
      if (typeof data.x === 'number' && typeof data.y === 'number') {
        const bounds = { x: data.x, y: data.y, width: data.width || 1440, height: data.height || 900 };
        const display = screen.getDisplayMatching(bounds);
        if (display) {
          return data;
        }
      }
    }
  } catch {}

  return defaultState;
}

function saveWindowState(win: BrowserWindow) {
  try {
    if (win.isDestroyed()) return;
    const isMaximized = win.isMaximized();
    const bounds = win.getBounds();
    const state: WindowState = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized,
    };
    fs.writeFileSync(getWindowStatePath(), JSON.stringify(state, null, 2), 'utf-8');
  } catch {}
}

function handleCommandLineArgs(argv: string[]) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const focalArg = argv.find((arg) => arg.toLowerCase().endsWith('.focal'));
  if (focalArg && fs.existsSync(focalArg)) {
    mainWindow.webContents.send('focal:open-file-path', path.resolve(focalArg));
  }
}

// Enforce single-instance lock to prevent port 48480 collisions
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      handleCommandLineArgs(commandLine);
    }
  });

  async function createWindow() {
    const windowState = loadWindowState();

    mainWindow = new BrowserWindow({
      width: windowState.width,
      height: windowState.height,
      x: windowState.x,
      y: windowState.y,
      minWidth: 1024,
      minHeight: 700,
      backgroundColor: '#090d16',
      title: 'FocalDOM Studio',
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    if (windowState.isMaximized) {
      mainWindow.maximize();
    }

    // Save state on window move, resize, and close
    mainWindow.on('resize', () => {
      if (mainWindow) saveWindowState(mainWindow);
    });
    mainWindow.on('move', () => {
      if (mainWindow) saveWindowState(mainWindow);
    });
    mainWindow.on('close', () => {
      if (mainWindow) saveWindowState(mainWindow);
    });

    // Start local WebSocket telemetry server for Chrome Extension (Mode A)
    telemetryServer = new DesktopTelemetryServer({ port: 48480 });
    await telemetryServer.start().catch((err) => {
      console.error('Failed to start telemetry server:', err);
    });

    // Register main process IPC handlers
    registerIpcHandlers(mainWindow, telemetryServer);

    // Load URL or static file
    if (process.env.VITE_DEV_SERVER_URL) {
      await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
      // In production, load bundled studio HTML or fallback
      const studioHtmlPath = path.join(__dirname, '../../studio/dist/index.html');
      mainWindow.loadFile(studioHtmlPath).catch(() => {
        mainWindow?.loadURL(
          'data:text/html,<html><body style="background:#090d16;color:white;"><h1>FocalDOM Desktop</h1></body></html>'
        );
      });
    }

    mainWindow.webContents.once('did-finish-load', () => {
      handleCommandLineArgs(process.argv);
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  app.whenReady().then(createWindow);

  app.on('window-all-closed', async () => {
    if (telemetryServer) {
      await telemetryServer.stop();
    }
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
