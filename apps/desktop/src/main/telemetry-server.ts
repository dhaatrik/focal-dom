import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'node:events';
import { DOMEventFrame, DOMEventFrameSchema } from '@focaldom/core';

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
        this.emit('client-connected');

        ws.on('message', (data: Buffer | string) => {
          try {
            const rawJson = typeof data === 'string' ? data : data.toString('utf-8');
            const parsed = JSON.parse(rawJson);

            // Validate frame schema
            const validated = DOMEventFrameSchema.safeParse(parsed);
            if (validated.success) {
              const frame = validated.data as DOMEventFrame;
              this.bufferedEvents.push(frame);
              this.emit('event-frame', frame);
            }
          } catch (err) {
            this.emit('parse-error', err);
          }
        });

        ws.on('close', () => {
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
