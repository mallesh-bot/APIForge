import React, { useState, useEffect } from 'react';
import { History, Trash2, ArrowUpRight, Search, Clock, RotateCcw } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';

export function HistoryPanel({ onReplayRequest }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [methodFilter, setMethodFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (methodFilter) params.method = methodFilter;
      const res = await api.get('/history', { params });
      if (res.data?.success) {
        setHistory(res.data.history || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [methodFilter]);

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your execution history?')) return;
    try {
      await api.delete('/history');
      setHistory([]);
    } catch (err) {
      alert('Failed to clear history');
    }
  };

  const filteredHistory = history.filter((item) => {
    if (!searchQuery) return true;
    return item.url.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const methodColors = {
    GET: 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40',
    POST: 'text-cyan-400 border-cyan-800/60 bg-cyan-950/40',
    PUT: 'text-amber-400 border-amber-800/60 bg-amber-950/40',
    PATCH: 'text-purple-400 border-purple-800/60 bg-purple-950/40',
    DELETE: 'text-rose-400 border-rose-800/60 bg-rose-950/40',
  };

  return (
    <div className="flex-1 flex flex-col bg-forge-card border border-forge-border rounded-lg overflow-hidden">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-center justify-between p-3.5 bg-forge-input border-b border-forge-border gap-2">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-100">Execution History</h2>
          <span className="text-xs text-slate-500 font-mono">({filteredHistory.length})</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-forge-card border border-forge-border rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>

          {/* Search URL */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter URL..."
              className="bg-forge-card border border-forge-border rounded pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-36 sm:w-48 font-mono"
            />
          </div>

          <Button
            size="xs"
            variant="ghost"
            onClick={fetchHistory}
            icon={RotateCcw}
            title="Refresh history"
          >
            Refresh
          </Button>

          {history.length > 0 && (
            <Button
              size="xs"
              variant="ghost"
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
              onClick={handleClearHistory}
              icon={Trash2}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-1.5">
        {loading && <p className="text-xs text-slate-500 italic p-4 text-center">Loading history...</p>}

        {!loading && filteredHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-slate-500">
            <History className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">No request history recorded</p>
            <p className="text-xs text-slate-500 mt-1">Send requests from the Request Builder to log them here.</p>
          </div>
        )}

        {!loading &&
          filteredHistory.map((item) => (
            <div
              key={item._id}
              onClick={() => onReplayRequest && onReplayRequest(item)}
              className="group flex items-center justify-between p-2.5 rounded border border-forge-border bg-forge-sidebar/30 hover:bg-forge-hover/60 cursor-pointer transition select-none"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span
                  className={`w-14 text-center text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    methodColors[item.method] || 'text-slate-300'
                  }`}
                >
                  {item.method}
                </span>

                <span className="font-mono text-xs text-slate-200 truncate group-hover:text-cyan-300 transition">
                  {item.url}
                </span>
              </div>

              <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                <StatusBadge statusCode={item.statusCode} statusText={item.statusText} />

                {item.durationMs !== undefined && (
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                    {item.durationMs}ms
                  </span>
                )}

                <span className="text-[10px] text-slate-500 hidden md:inline">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>

                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default HistoryPanel;
