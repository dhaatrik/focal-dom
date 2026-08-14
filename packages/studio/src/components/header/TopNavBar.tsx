import React from 'react';
import { useProjectStore } from '../../store/project-store';
import { useUIStore } from '../../store/ui-store';
import { Video, Undo2, Redo2, Download, Sparkles } from 'lucide-react';

export const TopNavBar: React.FC = () => {
  const project = useProjectStore((state) => state.project);
  const setTitle = useProjectStore((state) => state.setTitle);
  const undo = useProjectStore((state) => state.undo);
  const redo = useProjectStore((state) => state.redo);
  const history = useProjectStore((state) => state.history);
  const future = useProjectStore((state) => state.future);
  const setExportModalOpen = useUIStore((state) => state.setExportModalOpen);

  return (
    <header className="top-navbar">
      {/* Brand & Project Name */}
      <div className="top-navbar-left">
        <div className="brand-badge">
          <Sparkles size={16} className="text-blue-400" />
          <span className="brand-name">FocalDOM Studio</span>
        </div>

        <div className="project-title-container">
          <input
            type="text"
            className="project-title-input"
            value={project.title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Project"
          />
        </div>
      </div>

      {/* Undo / Redo Actions */}
      <div className="top-navbar-center">
        <button
          className="nav-action-btn"
          onClick={undo}
          disabled={history.length === 0}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          className="nav-action-btn"
          onClick={redo}
          disabled={future.length === 0}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>
        <span className="aspect-ratio-badge">{project.aspectRatio}</span>
      </div>

      {/* Export Action */}
      <div className="top-navbar-right">
        <button
          className="export-trigger-btn"
          onClick={() => setExportModalOpen(true)}
        >
          <Download size={16} />
          <span>Export Video</span>
        </button>
      </div>
    </header>
  );
};
