import React from 'react';
import { useProjectStore } from '../../store/project-store';
import { useUIStore } from '../../store/ui-store';
import { EasingCurve } from '@focaldom/core';
import { ZoomIn, Trash2, Crosshair } from 'lucide-react';

export const KeyframeInspector: React.FC = () => {
  const project = useProjectStore((state) => state.project);
  const updateKeyframe = useProjectStore((state) => state.updateKeyframe);
  const removeKeyframe = useProjectStore((state) => state.removeKeyframe);
  const selectedKeyframeId = useUIStore((state) => state.selectedKeyframeId);
  const setSelectedKeyframeId = useUIStore((state) => state.setSelectedKeyframeId);

  const selectedKeyframe = project.keyframes.find((k) => k.id === selectedKeyframeId);

  if (!selectedKeyframe) {
    return (
      <div className="inspector-panel empty-inspector">
        <Crosshair size={28} className="text-slate-500 mb-2" />
        <p className="text-slate-400 text-sm">Select a camera zoom block on the timeline to inspect its properties.</p>
      </div>
    );
  }

  const easingCurves: EasingCurve[] = ['spring', 'easeInOutCubic', 'linear'];

  return (
    <div className="inspector-panel keyframe-inspector">
      <div className="panel-header">
        <ZoomIn size={16} className="text-emerald-400" />
        <h3>Keyframe Inspector</h3>
      </div>

      {/* Zoom Scale Slider */}
      <div className="control-group">
        <div className="control-label-row">
          <span className="control-title">Zoom Magnification</span>
          <span className="control-value">{selectedKeyframe.zoomScale.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min="1.0"
          max="4.0"
          step="0.05"
          value={selectedKeyframe.zoomScale}
          onChange={(e) => updateKeyframe(selectedKeyframe.id, { zoomScale: Number(e.target.value) })}
          className="inspector-slider"
        />
      </div>

      {/* Pan Offsets */}
      <div className="control-group">
        <span className="control-title">Pan Focus Offset (px)</span>
        <div className="pan-inputs-row">
          <div className="pan-input-group">
            <span className="input-prefix">X:</span>
            <input
              type="number"
              value={selectedKeyframe.panOffset.x}
              onChange={(e) =>
                updateKeyframe(selectedKeyframe.id, {
                  panOffset: { ...selectedKeyframe.panOffset, x: Number(e.target.value) },
                })
              }
              className="inspector-number-input"
            />
          </div>
          <div className="pan-input-group">
            <span className="input-prefix">Y:</span>
            <input
              type="number"
              value={selectedKeyframe.panOffset.y}
              onChange={(e) =>
                updateKeyframe(selectedKeyframe.id, {
                  panOffset: { ...selectedKeyframe.panOffset, y: Number(e.target.value) },
                })
              }
              className="inspector-number-input"
            />
          </div>
        </div>
      </div>

      {/* Easing Curve */}
      <div className="control-group">
        <span className="control-title">Interpolation Curve</span>
        <select
          value={selectedKeyframe.easingCurve}
          onChange={(e) =>
            updateKeyframe(selectedKeyframe.id, { easingCurve: e.target.value as EasingCurve })
          }
          className="inspector-select"
        >
          {easingCurves.map((curve) => (
            <option key={curve} value={curve}>
              {curve}
            </option>
          ))}
        </select>
      </div>

      {/* Delete Action */}
      <div className="control-group mt-4">
        <button
          className="delete-keyframe-btn"
          onClick={() => {
            removeKeyframe(selectedKeyframe.id);
            setSelectedKeyframeId(null);
          }}
        >
          <Trash2 size={14} />
          <span>Delete Zoom Keyframe</span>
        </button>
      </div>
    </div>
  );
};
