export type CursorStyle = 'default' | 'pointer' | 'text' | 'grab' | 'grabbing' | 'crosshair';

export interface CursorPoint {
  x: number;
  y: number;
  timestampMs: number;
  style?: CursorStyle;
}

export interface VectorCursorState {
  x: number;
  y: number;
  style: CursorStyle;
  visible: boolean;
  velocity: {
    vx: number;
    vy: number;
  };
}

export interface ClickRippleState {
  id: string;
  x: number;
  y: number;
  startTimeMs: number;
  durationMs: number;
  maxRadius: number;
  color: string;
}
