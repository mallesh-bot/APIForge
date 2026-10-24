import React, { useState } from 'react';
import { PlayCircle, CheckCircle2, XCircle, Clock, Download, Layers } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useEnvironment } from '../../context/EnvironmentContext';
import { api } from '../../services/api';

export function CollectionRunner({ collections = [] }) {
  const { environments, activeEnvironmentId } = useEnvironment();

  const [selectedCollectionId, setSelectedCollectionId] = useState(collections[0]?._id || '');
  const [selectedEnvId, setSelectedEnvId] = useState(activeEnvironmentId || '');
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);

  React.useEffect(() => {
    if (collections.length > 0 && !selectedCollectionId) {
      setSelectedCollectionId(collections[0]._id);
    }
  }, [collections, selectedCollectionId]);

  const handleRun = async () => {
    if (!selectedCollectionId) return;

    setRunning(true);
    setReport(null);

    try {
      const res = await api.post(`/test-runs/collection/${selectedCollectionId}`, {
        environmentId: selectedEnvId || null,
      });

      if (res.data?.success) {
        setReport(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Collection test run failed');
    } finally {
      setRunning(false);
    }
  };

  const handleDownloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-run-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = report?.summary;
  const requests = report?.requests || [];

  return (
    <div className="flex-1 flex flex-col bg-forge-card border border-forge-border rounded-lg overflow-hidden">
      {/* Top Configuration Bar */}
      <div className="flex flex-wrap items-center justify-between p-4 bg-forge-input border-b border-forge-border gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-cyan-400" />
            Collection Test Runner
          </h2>
          <p className="text-xs text-slate-400">Execute all assertions in a collection sequentially</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Collection Select */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="text-slate-400">Collection:</span>
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="bg-forge-card border border-forge-border rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              {collections.map((c) => (
                <option key={c._id} value={c._id} className="bg-forge-card">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Environment Select */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="text-slate-400">Environment:</span>
            <select
              value={selectedEnvId}
              onChange={(e) => setSelectedEnvId(e.target.value)}
              className="bg-forge-card border border-forge-border rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="" className="bg-forge-card">No Environment</option>
              {environments.map((e) => (
                <option key={e._id} value={e._id} className="bg-forge-card">
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="md"
            loading={running}
            disabled={!selectedCollectionId}
            icon={PlayCircle}
            onClick={handleRun}
          >
            {running ? 'Running Tests...' : 'Run Collection'}
          </Button>

          {report && (
            <Button
              variant="outline"
              size="md"
              icon={Download}
              onClick={handleDownloadReport}
            >
              Export JSON
            </Button>
          )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
        {/* Loading State */}
        {running && (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium text-slate-200">Executing Collection Test Suite...</p>
            <p className="text-xs text-slate-500 mt-1">Evaluating assertions across all saved endpoints</p>
          </div>
        )}

        {/* Empty State */}
        {!running && !report && (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <Layers className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-300">Ready to execute tests</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
              Select a collection above and click "Run Collection" to run sequential automated tests against the active environment.
            </p>
          </div>
        )}

        {/* Summary Card */}
        {!running && report && summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-forge-sidebar/60 border border-forge-border rounded p-3 text-center">
              <span className="text-[11px] text-slate-400 uppercase font-mono">Requests</span>
              <p className="text-xl font-bold text-slate-100 font-mono mt-0.5">{summary.totalRequests}</p>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded p-3 text-center">
              <span className="text-[11px] text-emerald-400 uppercase font-mono">Passed Tests</span>
              <p className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{summary.passed}</p>
            </div>

            <div className={`p-3 rounded text-center border ${
              summary.failed === 0
                ? 'bg-forge-sidebar/60 border-forge-border'
                : 'bg-rose-950/20 border-rose-900/40'
            }`}>
              <span className="text-[11px] text-rose-400 uppercase font-mono">Failed Tests</span>
              <p className="text-xl font-bold text-rose-400 font-mono mt-0.5">{summary.failed}</p>
            </div>

            <div className="bg-forge-sidebar/60 border border-forge-border rounded p-3 text-center">
              <span className="text-[11px] text-slate-400 uppercase font-mono">Duration</span>
              <p className="text-xl font-bold text-cyan-400 font-mono mt-0.5">{summary.durationMs}ms</p>
            </div>
          </div>
        )}

        {/* Breakdown of Requests */}
        {!running && report && requests.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-slate-300">Endpoint Assertion Breakdown</h3>

            <div className="border border-forge-border rounded overflow-hidden divide-y divide-forge-border">
              {requests.map((r, i) => (
                <div key={i} className="p-3 bg-forge-sidebar/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {r.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      )}
                      <span className="font-semibold text-xs text-slate-100">{r.requestName}</span>
                      <span className="text-[10px] font-mono text-cyan-400 px-1 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/50">
                        {r.method}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge statusCode={r.statusCode} />
                      <span className="text-xs font-mono text-slate-400">{r.durationMs}ms</span>
                    </div>
                  </div>

                  {/* Assertion Chips */}
                  <div className="flex flex-wrap gap-1.5 pl-6">
                    {r.assertions.map((a, j) => (
                      <span
                        key={j}
                        className={`text-[11px] px-2 py-0.5 rounded font-mono border ${
                          a.passed
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                            : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                        }`}
                        title={a.message}
                      >
                        {a.passed ? '✓' : '✗'} {a.assertionType}: {a.message}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionRunner;
