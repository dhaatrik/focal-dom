export interface CameraState {
  x: number;
  y: number;
  scale: number;
}

export interface AffineMatrix2D {
  a: number; // Scale X
  b: number; // Skew Y
  c: number; // Skew X
  d: number; // Scale Y
  tx: number; // Translation X
  ty: number; // Translation Y
}

export interface ViewportDimensions {
  width: number;
  height: number;
  devicePixelRatio?: number;
}
