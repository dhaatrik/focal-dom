import { describe, it, expect, afterEach } from 'vitest';
import { WebSocket } from 'ws';
import { DesktopTelemetryServer } from '../src/main/telemetry-server';
import { DOMEventFrame } from '@focaldom/core';

describe('DesktopTelemetryServer (WebSocket Chrome Extension Mode A)', () => {
  let server: DesktopTelemetryServer | null = null;
  const testPort = 48499;

  afterEach(async () => {
    if (server) {
      await server.stop();
      server = null;
    }
  });

  it('starts server, receives DOM event frames over WebSocket, and buffers them', async () => {
    server = new DesktopTelemetryServer({ port: testPort });
    await server.start();
    expect(server.isRunning).toBe(true);

    const client = new WebSocket(`ws://127.0.0.1:${testPort}`);

    await new Promise<void>((resolve, reject) => {
      client.on('open', () => resolve());
      client.on('error', (err) => reject(err));
    });

    const mockFrame: DOMEventFrame = {
      frameIndex: 1,
      timestamp: 16.6,
      eventType: 'click',
      cursor: { x: 300, y: 400 },
      viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
      scrollOffset: { x: 0, y: 0 },
      activeStickyRegions: [],
    };

    const receivedPromise = new Promise<DOMEventFrame>((resolve) => {
      server?.once('event-frame', (frame) => resolve(frame));
    });

    client.send(JSON.stringify(mockFrame));

    const received = await receivedPromise;
    expect(received.frameIndex).toBe(1);
    expect(received.cursor.x).toBe(300);
    expect(received.eventType).toBe('click');

    const buffered = server.getBufferedEvents();
    expect(buffered.length).toBe(1);

    // Close client and server
    await new Promise<void>((resolve) => {
      client.on('close', () => resolve());
      client.close();
    });

    await server.stop();
    expect(server.isRunning).toBe(false);
  });
});
