/**
 * ============================================================================
 * App.tsx — Root Application Component
 * ============================================================================
 *
 * Composes the full-page layout:
 *   - Left: FileExplorer sidebar (280px fixed width).
 *   - Right: Editor placeholder area showing the VS Code-style welcome.
 *
 * The TreeProvider wraps the entire app so that any nested component
 * can access and mutate the file tree via `useTree()`.
 *
 * ============================================================================
 */

import React from 'react';
import { TreeProvider } from './context/TreeContext';
import FileExplorer from './components/FileExplorer';
import { Code2, Terminal, GitBranch, Settings } from 'lucide-react';

const App: React.FC = () => {
  return (
    <TreeProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-ide-bg">
        {/* ─── Sidebar: File Explorer ──────────────────────────────── */}
        <FileExplorer />

        {/* ─── Main Editor Area ────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Bar */}
          <div className="h-[35px] bg-ide-sidebar-header border-b border-ide-border flex items-center px-4 flex-shrink-0">
            <div className="flex items-center gap-2 text-[12px] text-ide-text-muted">
              <span className="px-3 py-1 bg-ide-bg border-t-2 border-ide-accent text-ide-text rounded-t text-[13px]">
                Welcome
              </span>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 flex items-center justify-center bg-ide-bg">
            <div className="text-center max-w-md">
              {/* Logo */}
              <div className="mb-8 flex justify-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-ide-accent to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Code2 size={40} className="text-white" />
                </div>
              </div>

              <h1 className="text-2xl font-light text-ide-text-bright mb-2 tracking-tight">
                Storebox File Explorer
              </h1>
              <p className="text-sm text-ide-text-muted mb-8 leading-relaxed">
                A VS Code-style file explorer built with React, TypeScript &amp; Tailwind CSS.
                <br />
                Built from scratch — no external tree libraries.
              </p>

              {/* Feature Cards */}
              <div className="grid grid-cols-2 gap-3 text-left mb-8">
                <FeatureCard
                  icon={<Code2 size={16} />}
                  title="Recursive Tree"
                  description="Infinite-depth nested folders with structural sharing."
                />
                <FeatureCard
                  icon={<Terminal size={16} />}
                  title="CRUD Operations"
                  description="Create, rename, and delete files & folders inline."
                />
                <FeatureCard
                  icon={<GitBranch size={16} />}
                  title="Immutable State"
                  description="Pure reducer pattern with no external state library."
                />
                <FeatureCard
                  icon={<Settings size={16} />}
                  title="Production Grade"
                  description="TypeScript strict mode, memoised callbacks, ARIA labels."
                />
              </div>

              {/* Keyboard Shortcuts Hint */}
              <div className="text-[11px] text-ide-text-muted">
                <span className="opacity-60">
                  Hover any item in the sidebar to see inline actions →
                </span>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="h-[22px] bg-ide-accent flex items-center justify-between px-3 flex-shrink-0">
            <div className="flex items-center gap-3 text-[11px] text-white/90">
              <span className="flex items-center gap-1">
                <GitBranch size={12} />
                main
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-white/90">
              <span>TypeScript React</span>
              <span>UTF-8</span>
            </div>
          </div>
        </main>
      </div>
    </TreeProvider>
  );
};

// ─── Sub-component: Feature Card ──────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="p-3 rounded-lg bg-ide-sidebar border border-ide-border hover:border-ide-accent/40 transition-colors group cursor-default">
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-ide-accent group-hover:text-ide-accent-hover transition-colors">
        {icon}
      </span>
      <span className="text-[12px] font-medium text-ide-text-bright">{title}</span>
    </div>
    <p className="text-[11px] text-ide-text-muted leading-relaxed">{description}</p>
  </div>
);

export default App;
