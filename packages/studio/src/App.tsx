import React from 'react';
import { TopNavBar } from './components/header/TopNavBar';
import { CanvasViewport } from './components/viewport/CanvasViewport';
import { PlaybackControls } from './components/viewport/PlaybackControls';
import { InspectorContainer } from './components/inspector/InspectorContainer';
import { TimelineContainer } from './components/timeline/TimelineContainer';
import { ExportModal } from './components/modal/ExportModal';
import { usePlaybackLoop } from './hooks/usePlaybackLoop';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import './index.css';

export const App: React.FC = () => {
  // Activate synchronized playback loop & keyboard shortcuts
  usePlaybackLoop();
  useKeyboardShortcuts();

  return (
    <div className="studio-app">
      <TopNavBar />

      <main className="studio-workspace">
        <section className="viewport-section">
          <CanvasViewport />
          <PlaybackControls />
        </section>

        <InspectorContainer />
      </main>

      <TimelineContainer />
      <ExportModal />
    </div>
  );
};

export default App;
