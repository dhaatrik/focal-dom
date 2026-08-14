import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'node:events';
import { DOMEventFrame, isValidDOMEventFrame } from '@focaldom/core';

export interface TelemetryServerOptions {
  port?: number;
  host?: string;
}

export class DesktopTelemetryServer extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private port: number;
  private host: string;
  private bufferedEvents: DOMEventFrame[] = [];
  private isListening = false;
  private activeClients = new Set<WebSocket>();

  constructor(options: TelemetryServerOptions = {}) {
    super();
    this.port = options.port ?? 48480;
    this.host = options.host ?? '127.0.0.1';
  }

  /**
   * Starts the WebSocket server listening for Chrome Extension telemetry.
   */
  start(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (this.isListening && this.wss) {
        resolve(this.port);
        return;
      }

      this.wss = new WebSocketServer({ port: this.port, host: this.host }, () => {
        this.isListening = true;
        this.emit('listening', { port: this.port, host: this.host });
        resolve(this.port);
      });

      this.wss.on('error', (err) => {
        this.emit('error', err);
        reject(err);
      });

      this.wss.on('connection', (ws: WebSocket) => {
        this.activeClients.add(ws);
        this.emit('client-connected');

        ws.on('message', (data: Buffer | string) => {
          try {
            const rawJson = typeof data === 'string' ? data : data.toString('utf-8');
            const parsed = JSON.parse(rawJson);

            // Validate frame schema
            if (isValidDOMEventFrame(parsed)) {
              this.bufferedEvents.push(parsed);
              this.emit('event-frame', parsed);
            }
          } catch (err) {
            this.emit('parse-error', err);
          }
        });

        ws.on('close', () => {
          this.activeClients.delete(ws);
          this.emit('client-disconnected');
        });
      });
    });
  }

  /**
   * Stops the WebSocket server and disconnects active clients.
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.wss) {
        this.isListening = false;
        resolve();
        return;
      }

      // Close all connected client sockets
      for (const client of this.activeClients) {
        try {
          client.terminate();
        } catch {
          // Ignore
        }
      }
      this.activeClients.clear();

      this.wss.close(() => {
        this.isListening = false;
        this.wss = null;
        this.emit('closed');
        resolve();
      });
    });
  }

  /**
   * Returns all event frames buffered during the session.
   */
  getBufferedEvents(): DOMEventFrame[] {
    return [...this.bufferedEvents];
  }

  /**
   * Clears the buffered events.
   */
  clearBuffer(): void {
    this.bufferedEvents = [];
  }

  get isRunning(): boolean {
    return this.isListening;
  }
}
