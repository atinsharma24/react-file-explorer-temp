/**
 * ============================================================================
 * App.tsx — Root Application Component
 * ============================================================================
 *
 * Renders the File Explorer as a centered, macOS-window-style panel.
 * The TreeProvider wraps the entire app so that any nested component
 * can access and mutate the file tree via `useTree()`.
 *
 * ============================================================================
 */

import React from 'react';
import { TreeProvider } from './context/TreeContext';
import FileExplorer from './components/FileExplorer';

const App: React.FC = () => {
  return (
    <TreeProvider>
      <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#f0f4f8] to-[#e2e8f0] p-6">
        <FileExplorer />
      </div>
    </TreeProvider>
  );
};

export default App;
