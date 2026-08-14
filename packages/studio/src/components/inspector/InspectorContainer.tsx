import React from 'react';
import { useUIStore, InspectorTab } from '../../store/ui-store';
import { PhysicsTuner } from './PhysicsTuner';
import { StylingPanel } from './StylingPanel';
import { KeyframeInspector } from './KeyframeInspector';
import { Activity, Palette, ZoomIn } from 'lucide-react';

export const InspectorContainer: React.FC = () => {
  const activeTab = useUIStore((state) => state.activeInspectorTab);
  const setActiveTab = useUIStore((state) => state.setActiveInspectorTab);
  const selectedKeyframeId = useUIStore((state) => state.selectedKeyframeId);

  const tabs: Array<{ id: InspectorTab; label: string; icon: React.ReactNode }> = [
    { id: 'physics', label: 'Physics', icon: <Activity size={14} /> },
    { id: 'styling', label: 'Styling', icon: <Palette size={14} /> },
    {
      id: 'keyframe',
      label: selectedKeyframeId ? 'Keyframe *' : 'Keyframe',
      icon: <ZoomIn size={14} />,
    },
  ];

  return (
    <aside className="inspector-sidebar">
      {/* Tab Bar */}
      <div className="inspector-tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`inspector-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div className="inspector-tab-content">
        {activeTab === 'physics' && <PhysicsTuner />}
        {activeTab === 'styling' && <StylingPanel />}
        {activeTab === 'keyframe' && <KeyframeInspector />}
      </div>
    </aside>
  );
};
