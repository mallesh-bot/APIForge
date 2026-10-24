import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toast({ type = 'info', message, onClose }) {
  if (!message) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/50 bg-emerald-950/90 text-emerald-200',
    error: 'border-rose-500/50 bg-rose-950/90 text-rose-200',
    info: 'border-cyan-500/50 bg-cyan-950/90 text-cyan-200',
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl backdrop-blur text-sm transition-all duration-200 ${borders[type]}`}
    >
      {icons[type]}
      <span className="font-medium text-xs sm:text-sm">{message}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-70 hover:opacity-100 p-0.5 ml-2">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default Toast;
