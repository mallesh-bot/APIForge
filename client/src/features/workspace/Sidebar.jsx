import React from 'react';
import {
  Send,
  FolderTree,
  Variable,
  History,
  PlayCircle,
  FileText,
} from 'lucide-react';

export function Sidebar({ activeView, onViewChange }) {
  const items = [
    { id: 'requests', label: 'Request Builder', icon: Send },
    { id: 'collections', label: 'Collections', icon: FolderTree },
    { id: 'environments', label: 'Environments', icon: Variable },
    { id: 'history', label: 'History', icon: History },
    { id: 'runner', label: 'Test Runner', icon: PlayCircle },
    { id: 'docs', label: 'API Docs', icon: FileText },
  ];

  return (
    <aside className="w-16 md:w-56 bg-forge-sidebar border-r border-forge-border flex flex-col justify-between py-3 flex-shrink-0 select-none">
      <nav className="flex flex-col gap-1 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-forge-hover'
              }`}
              title={item.label}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 text-[10px] text-slate-500 hidden md:block">
        <div className="border-t border-forge-border pt-3">
          <p className="font-mono">APIForge v1.0.0</p>
          <p className="text-slate-600 mt-0.5">MERN API Platform</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
