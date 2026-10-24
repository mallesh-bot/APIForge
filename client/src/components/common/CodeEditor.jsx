import React, { useState } from 'react';
import { Copy, Check, AlignLeft } from 'lucide-react';

export function CodeEditor({
  value = '',
  onChange,
  readOnly = false,
  language = 'json',
  placeholder = '',
  minHeight = 'min-h-[220px]',
}) {
  const [copied, setCopied] = useState(false);
  const [jsonError, setJsonError] = useState(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange && onChange(formatted);
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const handleChange = (e) => {
    const newVal = e.target.value;
    onChange && onChange(newVal);

    if (language === 'json' && newVal.trim()) {
      try {
        JSON.parse(newVal);
        setJsonError(null);
      } catch (err) {
        setJsonError(err.message);
      }
    } else {
      setJsonError(null);
    }
  };

  return (
    <div className="flex flex-col border border-forge-border rounded bg-forge-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-forge-input border-b border-forge-border text-xs text-slate-400">
        <span className="font-mono uppercase text-[11px] text-slate-400 font-semibold">{language}</span>
        <div className="flex items-center gap-2">
          {language === 'json' && !readOnly && (
            <button
              type="button"
              onClick={handleFormatJson}
              className="inline-flex items-center gap-1 hover:text-cyan-400 transition"
              title="Prettify JSON"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              Format
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 hover:text-white transition"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          readOnly={readOnly}
          placeholder={placeholder}
          spellCheck={false}
          className={`w-full ${minHeight} bg-forge-bg text-slate-200 font-mono text-xs p-3 focus:outline-none resize-y leading-relaxed`}
        />
      </div>

      {jsonError && (
        <div className="px-3 py-1.5 bg-rose-950/40 border-t border-rose-900/50 text-rose-300 text-[11px] font-mono">
          JSON Syntax Warning: {jsonError}
        </div>
      )}
    </div>
  );
}

export default CodeEditor;
