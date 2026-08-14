import React from 'react';
import { useProjectStore } from '../../store/project-store';
import { Activity, Zap, Shield, Weight } from 'lucide-react';

export const PhysicsTuner: React.FC = () => {
  const springConfig = useProjectStore((state) => state.project.springConfig);
  const updateSpringConfig = useProjectStore((state) => state.updateSpringConfig);

  const applyPreset = (stiffness: number, damping: number, mass: number) => {
    updateSpringConfig({ stiffness, damping, mass });
  };

  return (
    <div className="inspector-panel physics-tuner">
      <div className="panel-header">
        <Activity size={16} className="text-blue-400" />
        <h3>Spring Physics Camera</h3>
      </div>

      {/* Quick Presets */}
      <div className="presets-row">
        <button
          className="preset-pill"
          onClick={() => applyPreset(240, 28, 1.0)}
        >
          Snappy
        </button>
        <button
          className="preset-pill"
          onClick={() => applyPreset(140, 22, 1.0)}
        >
          Smooth
        </button>
        <button
          className="preset-pill"
          onClick={() => applyPreset(180, 14, 1.0)}
        >
          Bouncy
        </button>
      </div>

      {/* Stiffness Slider */}
      <div className="control-group">
        <div className="control-label-row">
          <span className="control-title">
            <Zap size={14} className="text-amber-400 inline mr-1" />
            Stiffness
          </span>
          <span className="control-value">{springConfig.stiffness}</span>
        </div>
        <input
          type="range"
          min="40"
          max="400"
          step="5"
          value={springConfig.stiffness}
          onChange={(e) => updateSpringConfig({ stiffness: Number(e.target.value) })}
          className="inspector-slider"
        />
      </div>

      {/* Damping Slider */}
      <div className="control-group">
        <div className="control-label-row">
          <span className="control-title">
            <Shield size={14} className="text-emerald-400 inline mr-1" />
            Damping
          </span>
          <span className="control-value">{springConfig.damping}</span>
        </div>
        <input
          type="range"
          min="5"
          max="60"
          step="1"
          value={springConfig.damping}
          onChange={(e) => updateSpringConfig({ damping: Number(e.target.value) })}
          className="inspector-slider"
        />
      </div>

      {/* Mass Slider */}
      <div className="control-group">
        <div className="control-label-row">
          <span className="control-title">
            <Weight size={14} className="text-purple-400 inline mr-1" />
            Mass
          </span>
          <span className="control-value">{springConfig.mass.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0.2"
          max="3.0"
          step="0.1"
          value={springConfig.mass}
          onChange={(e) => updateSpringConfig({ mass: Number(e.target.value) })}
          className="inspector-slider"
        />
      </div>
    </div>
  );
};
