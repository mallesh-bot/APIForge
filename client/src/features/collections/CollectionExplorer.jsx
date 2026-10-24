import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';

export function CollectionExplorer({
  collections = [],
  onSelectRequest,
  onRefresh,
  onImportDemo,
  importingDemo = false,
}) {
  const [expandedCollections, setExpandedCollections] = useState({});
  const [requestsByCollection, setRequestsByCollection] = useState({});
  const [loadingRequests, setLoadingRequests] = useState({});

  // Create Collection Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const toggleCollection = async (colId) => {
    const isNowExpanded = !expandedCollections[colId];
    setExpandedCollections((prev) => ({ ...prev, [colId]: isNowExpanded }));

    if (isNowExpanded && !requestsByCollection[colId]) {
      setLoadingRequests((prev) => ({ ...prev, [colId]: true }));
      try {
        const res = await api.get(`/collections/${colId}`);
        if (res.data?.success) {
          setRequestsByCollection((prev) => ({
            ...prev,
            [colId]: res.data.collection.requests || [],
          }));
        }
      } catch (err) {
        console.error('Failed to load collection requests:', err);
      } finally {
        setLoadingRequests((prev) => ({ ...prev, [colId]: false }));
      }
    }
  };

  const handleCreateCollection = async () => {
    if (!newColName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/collections', {
        name: newColName.trim(),
        description: newColDesc.trim(),
      });
      if (res.data?.success) {
        setNewColName('');
        setNewColDesc('');
        setIsCreateModalOpen(false);
        onRefresh && onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCollection = async (e, colId, colName) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete collection "${colName}" and all its saved requests?`)) {
      return;
    }
    try {
      await api.delete(`/collections/${colId}`);
      onRefresh && onRefresh();
    } catch (err) {
      alert('Failed to delete collection');
    }
  };

  const handleDuplicateRequest = async (e, reqId, colId) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/requests/${reqId}/duplicate`);
      if (res.data?.success) {
        // Refresh local requests for this collection
        const colRes = await api.get(`/collections/${colId}`);
        if (colRes.data?.success) {
          setRequestsByCollection((prev) => ({
            ...prev,
            [colId]: colRes.data.collection.requests || [],
          }));
        }
        onRefresh && onRefresh();
      }
    } catch (err) {
      alert('Failed to duplicate request');
    }
  };

  const handleDeleteRequest = async (e, reqId, colId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved request?')) return;
    try {
      await api.delete(`/requests/${reqId}`);
      setRequestsByCollection((prev) => ({
        ...prev,
        [colId]: (prev[colId] || []).filter((r) => r._id !== reqId),
      }));
      onRefresh && onRefresh();
    } catch (err) {
      alert('Failed to delete request');
    }
  };

  const methodColors = {
    GET: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50',
    POST: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/50',
    PUT: 'text-amber-400 bg-amber-950/40 border-amber-800/50',
    PATCH: 'text-purple-400 bg-purple-950/40 border-purple-800/50',
    DELETE: 'text-rose-400 bg-rose-950/40 border-rose-800/50',
  };

  return (
    <div className="flex-1 flex flex-col bg-forge-card border border-forge-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-forge-input border-b border-forge-border">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">API Collections</h2>
          <p className="text-[11px] text-slate-400">Organize and test endpoints</p>
        </div>

        <div className="flex items-center gap-2">
          {onImportDemo && (
            <Button
              variant="outline"
              size="xs"
              loading={importingDemo}
              onClick={onImportDemo}
              icon={Sparkles}
            >
              Import ShopKart Demo
            </Button>
          )}

          <Button
            variant="primary"
            size="xs"
            onClick={() => setIsCreateModalOpen(true)}
            icon={Plus}
          >
            New Collection
          </Button>
        </div>
      </div>

      {/* Collection Tree */}
      <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-1.5">
        {collections.map((col) => {
          const isExpanded = expandedCollections[col._id];
          const requests = requestsByCollection[col._id] || [];
          const isLoading = loadingRequests[col._id];

          return (
            <div key={col._id} className="border border-forge-border rounded bg-forge-sidebar/40 overflow-hidden">
              {/* Collection Row */}
              <div
                onClick={() => toggleCollection(col._id)}
                className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-forge-hover/60 transition select-none"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  )}

                  {isExpanded ? (
                    <FolderOpen className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  ) : (
                    <Folder className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}

                  <span className="text-xs font-semibold text-slate-200 truncate">{col.name}</span>

                  {col.isDemoCollection && (
                    <span className="px-1.5 py-0.2 bg-cyan-950/70 border border-cyan-800 text-[10px] text-cyan-300 rounded font-mono font-medium">
                      Demo
                    </span>
                  )}

                  <span className="text-[11px] text-slate-500 font-mono">
                    ({col.requestCount ?? requests.length} reqs)
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleDeleteCollection(e, col._id, col.name)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-950/20"
                    title="Delete collection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Expanded Requests List */}
              {isExpanded && (
                <div className="pl-7 pr-2 py-1.5 bg-forge-bg/60 border-t border-forge-border flex flex-col gap-1">
                  {isLoading && (
                    <p className="text-[11px] text-slate-500 py-1 italic">Loading requests...</p>
                  )}

                  {!isLoading && requests.length === 0 && (
                    <p className="text-[11px] text-slate-500 py-1 italic">
                      No requests saved yet. Save a request from the builder.
                    </p>
                  )}

                  {!isLoading &&
                    requests.map((req) => (
                      <div
                        key={req._id}
                        onClick={() => onSelectRequest && onSelectRequest(req)}
                        className="group flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-forge-hover/80 cursor-pointer transition border border-transparent hover:border-forge-border"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className={`w-12 text-center text-[10px] font-mono font-bold px-1 py-0.5 rounded border ${
                              methodColors[req.method] || 'text-slate-300'
                            }`}
                          >
                            {req.method}
                          </span>
                          <span className="text-xs text-slate-300 group-hover:text-white truncate font-medium">
                            {req.name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono truncate hidden sm:inline">
                            {req.urlTemplate}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => handleDuplicateRequest(e, req._id, col._id)}
                            className="p-1 text-slate-500 hover:text-cyan-400 rounded hover:bg-cyan-950/20"
                            title="Duplicate request"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteRequest(e, req._id, col._id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-950/20"
                            title="Delete request"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}

        {collections.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <Folder className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">No collections found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Create a new collection or click "Import ShopKart Demo" to load the complete 18-request testing suite.
            </p>
          </div>
        )}
      </div>

      {/* New Collection Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Collection"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Collection Name"
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            placeholder="e.g. Products Service API"
            autoFocus
          />

          <Input
            label="Description (optional)"
            value={newColDesc}
            onChange={(e) => setNewColDesc(e.target.value)}
            placeholder="Endpoints for managing e-commerce catalog"
          />

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={creating}
              disabled={!newColName.trim()}
              onClick={handleCreateCollection}
            >
              Create Collection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CollectionExplorer;
