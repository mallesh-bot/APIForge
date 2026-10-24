import React from 'react';
import { Terminal, LogOut, User as UserIcon, Globe, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEnvironment } from '../../context/EnvironmentContext';

export function TopNav({ onImportDemo }) {
  const { user, logout } = useAuth();
  const { environments, activeEnvironmentId, selectEnvironment } = useEnvironment();

  return (
    <header className="h-12 bg-forge-sidebar border-b border-forge-border flex items-center justify-between px-4 z-20 select-none">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-950">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-wide text-slate-100">
            API<span className="text-cyan-400">Forge</span>
          </span>
        </div>
        <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-mono font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-800/50 rounded">
          Workspace
        </span>
      </div>

      {/* Middle: Active Environment & Quick Demo Import */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Import Button */}
        {onImportDemo && (
          <button
            onClick={onImportDemo}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 transition shadow-sm"
            title="Import 18-endpoint ShopKart demo collection"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import ShopKart Demo</span>
          </button>
        )}

        {/* Environment Selector Dropdown */}
        <div className="flex items-center gap-1.5 bg-forge-card border border-forge-border rounded px-2.5 py-1 text-xs">
          <Globe className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span className="text-slate-400 text-[11px] hidden sm:inline">Env:</span>
          <select
            value={activeEnvironmentId}
            onChange={(e) => selectEnvironment(e.target.value)}
            className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
          >
            <option value="" className="bg-forge-card text-slate-400">
              No Environment
            </option>
            {environments.map((env) => (
              <option key={env._id} value={env._id} className="bg-forge-card text-slate-100">
                {env.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* User profile & Logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <div className="w-6 h-6 rounded-full bg-forge-input border border-forge-border flex items-center justify-center text-cyan-400">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <span className="hidden md:inline font-medium text-slate-200">{user?.name || user?.email}</span>
        </div>

        <button
          onClick={logout}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

export default TopNav;
