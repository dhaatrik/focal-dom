import React from 'react';
import { useProjectStore } from '../../store/project-store';
import { AspectRatio } from '@focaldom/core';
import { Palette, Layout, Sliders } from 'lucide-react';

export const StylingPanel: React.FC = () => {
  const project = useProjectStore((state) => state.project);
  const setAspectRatio = useProjectStore((state) => state.setAspectRatio);
  const updateWindowFrame = useProjectStore((state) => state.updateWindowFrame);
  const updateBackgroundStyle = useProjectStore((state) => state.updateBackgroundStyle);

  const aspectRatios: AspectRatio[] = ['16:9', '9:16', '1:1', '4:3'];

  const gradientPresets = [
    { name: 'Midnight', colors: ['#0f172a', '#1e1b4b'] },
    { name: 'Sunset', colors: ['#4c0519', '#831843'] },
    { name: 'Emerald', colors: ['#064e3b', '#065f46'] },
    { name: 'Obsidian', colors: ['#09090b', '#18181b'] },
  ];

  return (
    <div className="inspector-panel styling-panel">
      <div className="panel-header">
        <Palette size={16} className="text-purple-400" />
        <h3>Canvas & Window Styling</h3>
      </div>

      {/* Aspect Ratio Presets */}
      <div className="control-group">
        <span className="control-title">Aspect Ratio</span>
        <div className="aspect-ratio-buttons">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio}
              className={`aspect-btn ${project.aspectRatio === ratio ? 'active' : ''}`}
              onClick={() => setAspectRatio(ratio)}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>

      {/* Window Frame Controls */}
      <div className="control-group">
        <div className="control-label-row">
          <span className="control-title">Window Corner Radius</span>
          <span className="control-value">{project.windowFrame.borderRadius}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="32"
          value={project.windowFrame.borderRadius}
          onChange={(e) => updateWindowFrame({ borderRadius: Number(e.target.value) })}
          className="inspector-slider"
        />
      </div>

      {/* Shadow Blur */}
      <div className="control-group">
        <div className="control-label-row">
          <span className="control-title">Drop Shadow Blur</span>
          <span className="control-value">{project.windowFrame.shadowBlur}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="64"
          value={project.windowFrame.shadowBlur}
          onChange={(e) => updateWindowFrame({ shadowBlur: Number(e.target.value) })}
          className="inspector-slider"
        />
      </div>

      {/* Show Window Titlebar Controls */}
      <div className="control-group checkbox-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={project.windowFrame.showControls}
            onChange={(e) => updateWindowFrame({ showControls: e.target.checked })}
            className="inspector-checkbox"
          />
          <span>Show macOS Window Titlebar Controls</span>
        </label>
      </div>

      {/* Background Gradient Presets */}
      <div className="control-group">
        <span className="control-title">Background Palettes</span>
        <div className="gradient-presets-grid">
          {gradientPresets.map((g) => (
            <button
              key={g.name}
              className="gradient-preset-card"
              style={{
                background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})`,
              }}
              onClick={() => updateBackgroundStyle({ type: 'gradient', colors: g.colors })}
            >
              <span className="gradient-name">{g.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
