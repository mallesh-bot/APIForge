import React, { useState } from 'react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CodeEditor } from '../../components/common/CodeEditor';
import { Clock, HardDrive, CheckCircle2, XCircle, Search } from 'lucide-react';

export function ResponseViewer({ response, assertions = [], loading = false }) {
  const [activeTab, setActiveTab] = useState('body');
  const [filterText, setFilterText] = useState('');

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-forge-card border border-forge-border rounded-lg text-slate-400">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-300">Executing request...</p>
        <p className="text-xs text-slate-500 mt-1">Inspecting response through secure outbound runner</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-forge-card border border-forge-border rounded-lg text-slate-500 select-none">
        <div className="w-12 h-12 rounded-full bg-forge-input border border-forge-border flex items-center justify-center text-slate-600 mb-3">
          <Search className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-300">No Response Yet</p>
        <p className="text-xs text-slate-500 text-center max-w-sm mt-1">
          Select an HTTP method, enter a URL or variable template like <code className="text-cyan-400 font-mono">{'{{baseUrl}}'}</code>, and click <strong>Send</strong>.
        </p>
      </div>
    );
  }

  const { statusCode, statusText, durationMs, responseSize, headers = {}, body, rawBody } = response;

  const passedAssertions = assertions.filter((a) => a.passed).length;
  const totalAssertions = assertions.length;

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const bodyContent = typeof body === 'object' ? JSON.stringify(body, null, 2) : String(rawBody || body || '');

  return (
    <div className="flex-1 flex flex-col bg-forge-card border border-forge-border rounded-lg overflow-hidden">
      {/* Response Metrics Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-forge-input border-b border-forge-border gap-2">
        <div className="flex items-center gap-3">
          <StatusBadge statusCode={statusCode} statusText={statusText} />

          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{durationMs} ms</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatSize(responseSize)}</span>
          </div>
        </div>

        {totalAssertions > 0 && (
          <div
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${
              passedAssertions === totalAssertions
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
            }`}
          >
            <span>Tests: {passedAssertions}/{totalAssertions} Passed</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center px-3 border-b border-forge-border bg-forge-sidebar/50 text-xs">
        <button
          onClick={() => setActiveTab('body')}
          className={`px-3 py-2 font-medium border-b-2 transition ${
            activeTab === 'body'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Body
        </button>
        <button
          onClick={() => setActiveTab('headers')}
          className={`px-3 py-2 font-medium border-b-2 transition ${
            activeTab === 'headers'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Headers ({Object.keys(headers).length})
        </button>
        {totalAssertions > 0 && (
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-2 font-medium border-b-2 transition ${
              activeTab === 'tests'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Test Results ({passedAssertions}/{totalAssertions})
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 p-3 overflow-y-auto">
        {activeTab === 'body' && (
          <CodeEditor
            value={bodyContent}
            readOnly={true}
            language={typeof body === 'object' ? 'json' : 'text'}
            minHeight="min-h-[350px]"
          />
        )}

        {activeTab === 'headers' && (
          <div className="border border-forge-border rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-forge-input text-slate-400 border-b border-forge-border">
                <tr>
                  <th className="px-3 py-2 font-medium">Header</th>
                  <th className="px-3 py-2 font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forge-border font-mono text-[11px]">
                {Object.entries(headers).map(([k, v]) => (
                  <tr key={k} className="hover:bg-forge-hover/50">
                    <td className="px-3 py-1.5 text-cyan-400 font-medium">{k}</td>
                    <td className="px-3 py-1.5 text-slate-300 break-all">{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="flex flex-col gap-2">
            {assertions.map((res, i) => (
              <div
                key={i}
                className={`p-3 rounded border flex items-start gap-3 text-xs ${
                  res.passed
                    ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-900/40 text-rose-200'
                }`}
              >
                {res.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100">{res.assertionType}</span>
                    <span className="font-mono text-[11px] opacity-75">{res.message}</span>
                  </div>
                  {!res.passed && (
                    <div className="mt-1 text-[11px] text-slate-300 font-mono">
                      Expected: <span className="text-cyan-400">{res.expected}</span> | Actual:{' '}
                      <span className="text-rose-400">{res.actual}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResponseViewer;
