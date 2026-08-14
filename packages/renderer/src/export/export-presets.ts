export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  fps: number;
  format: 'mp4' | 'mov' | 'gif';
  ffmpegArgs: string[];
}

export const EXPORT_PRESETS: Record<string, ExportPreset> = {
  'youtube-4k': {
    id: 'youtube-4k',
    name: 'YouTube 4K Ultra HD',
    description: '3840x2160 @ 60 FPS, High Profile H.264 CRF 16',
    width: 3840,
    height: 2160,
    fps: 60,
    format: 'mp4',
    ffmpegArgs: [
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', '16',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
    ],
  },
  'web-1080p': {
    id: 'web-1080p',
    name: 'Web / Social 1080p',
    description: '1920x1080 @ 60 FPS, H.264 CRF 18',
    width: 1920,
    height: 1080,
    fps: 60,
    format: 'mp4',
    ffmpegArgs: [
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
    ],
  },
  'shorts-9-16': {
    id: 'shorts-9-16',
    name: 'Shorts & TikTok 9:16',
    description: '1080x1920 @ 60 FPS Vertical, H.264 CRF 18',
    width: 1080,
    height: 1920,
    fps: 60,
    format: 'mp4',
    ffmpegArgs: [
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
    ],
  },
  'prores-422': {
    id: 'prores-422',
    name: 'Apple ProRes 422 HQ',
    description: '3840x2160 @ 60 FPS, ProRes 422 HQ Master',
    width: 3840,
    height: 2160,
    fps: 60,
    format: 'mov',
    ffmpegArgs: [
      '-c:v', 'prores_ks',
      '-profile:v', '3',
      '-pix_fmt', 'yuv422p10le',
    ],
  },
  'gif-high-fps': {
    id: 'gif-high-fps',
    name: 'High-Framerate Palettized GIF',
    description: '800x450 @ 30 FPS, Dual-pass color palette',
    width: 800,
    height: 450,
    fps: 30,
    format: 'gif',
    ffmpegArgs: [
      '-vf', 'split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer',
    ],
  },
};
