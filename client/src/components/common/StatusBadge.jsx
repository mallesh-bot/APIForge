import React from 'react';

export function StatusBadge({ statusCode, statusText }) {
  if (!statusCode) return null;

  let colorClass = 'bg-slate-800 text-slate-300 border-slate-700';

  if (statusCode >= 200 && statusCode < 300) {
    colorClass = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
  } else if (statusCode >= 300 && statusCode < 400) {
    colorClass = 'bg-amber-950/60 text-amber-400 border-amber-800/60';
  } else if (statusCode >= 400 && statusCode < 500) {
    colorClass = 'bg-orange-950/60 text-orange-400 border-orange-800/60';
  } else if (statusCode >= 500) {
    colorClass = 'bg-rose-950/60 text-rose-400 border-rose-800/60';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium border ${colorClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      <span>{statusCode}</span>
      {statusText && <span className="opacity-80 font-sans text-[11px]">{statusText}</span>}
    </div>
  );
}

export default StatusBadge;
