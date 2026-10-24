import React, { useState, useEffect } from 'react';
import { FileText, Download, Copy, Check, ExternalLink, Code } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';

export function DocumentationViewer({ collections = [] }) {
  const [selectedColId, setSelectedColId] = useState(collections[0]?._id || '');
  const [docData, setDocData] = useState(null);
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  useEffect(() => {
    if (collections.length > 0 && !selectedColId) {
      setSelectedColId(collections[0]._id);
    }
  }, [collections, selectedColId]);

  useEffect(() => {
    async function loadDocs() {
      if (!selectedColId) return;
      setLoading(true);
      try {
        const [docRes, mdRes] = await Promise.all([
          api.get(`/collections/${selectedColId}/documentation`),
          api.get(`/collections/${selectedColId}/documentation/markdown`),
        ]);

        if (docRes.data?.success) setDocData(docRes.data.documentation);
        if (mdRes.data?.success) setMarkdown(mdRes.data.markdown);
      } catch (err) {
        console.error('Failed to load documentation:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDocs();
  }, [selectedColId]);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docData?.collection?.name || 'api-docs'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const methodColors = {
    GET: 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40',
    POST: 'text-cyan-400 border-cyan-800/60 bg-cyan-950/40',
    PUT: 'text-amber-400 border-amber-800/60 bg-amber-950/40',
    PATCH: 'text-purple-400 border-purple-800/60 bg-purple-950/40',
    DELETE: 'text-rose-400 border-rose-800/60 bg-rose-950/40',
  };

  return (
    <div className="flex-1 flex flex-col bg-forge-card border border-forge-border rounded-lg overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between p-4 bg-forge-input border-b border-forge-border gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            API Documentation Generator
          </h2>
          <p className="text-xs text-slate-400">Generate interactive reference and export Markdown docs</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedColId}
            onChange={(e) => setSelectedColId(e.target.value)}
            className="bg-forge-card border border-forge-border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            {collections.map((c) => (
              <option key={c._id} value={c._id} className="bg-forge-card">
                {c.name}
              </option>
            ))}
          </select>

          <Button
            size="md"
            variant="secondary"
            onClick={handleCopyMarkdown}
            icon={copiedMd ? Check : Copy}
          >
            {copiedMd ? 'Copied Markdown' : 'Copy Markdown'}
          </Button>

          <Button
            size="md"
            variant="primary"
            onClick={handleDownloadMarkdown}
            icon={Download}
          >
            Export .md
          </Button>
        </div>
      </div>

      {/* Docs Body */}
      <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full">
        {loading && <p className="text-xs text-slate-400 italic text-center p-8">Generating documentation...</p>}

        {!loading && docData && (
          <div className="flex flex-col gap-6">
            {/* Header info */}
            <div className="border-b border-forge-border pb-4">
              <h1 className="text-xl font-bold text-slate-100">{docData.collection.name}</h1>
              {docData.collection.description && (
                <p className="text-sm text-slate-400 mt-1">{docData.collection.description}</p>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 font-mono">
                <span>{docData.endpoints.length} Endpoints</span>
                <span>•</span>
                <span>Generated {new Date(docData.collection.generatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Endpoints List */}
            <div className="flex flex-col gap-6">
              {docData.endpoints.map((ep, i) => (
                <div
                  key={ep.id || i}
                  className="bg-forge-sidebar/40 border border-forge-border rounded-lg p-5 flex flex-col gap-4"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        methodColors[ep.method] || 'text-slate-300'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-sm font-semibold text-slate-100">{ep.name}</span>
                    <span className="text-xs font-mono text-cyan-400 bg-forge-input px-2 py-0.5 rounded border border-forge-border">
                      {ep.urlTemplate}
                    </span>
                  </div>

                  {ep.description && <p className="text-xs text-slate-400">{ep.description}</p>}

                  {/* Auth Requirement */}
                  {ep.authType && ep.authType !== 'NONE' && (
                    <div className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Authentication: </span>
                      <span className="font-mono text-cyan-400">{ep.authType}</span>
                    </div>
                  )}

                  {/* Query Parameters */}
                  {ep.params && ep.params.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-xs font-semibold text-slate-300">Query Parameters</h4>
                      <div className="border border-forge-border rounded overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-forge-input text-slate-400 border-b border-forge-border font-medium">
                            <tr>
                              <th className="px-3 py-1.5 w-1/3">Parameter</th>
                              <th className="px-3 py-1.5">Sample Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-forge-border font-mono text-xs">
                            {ep.params.map((p, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-1 text-cyan-400">{p.key}</td>
                                <td className="px-3 py-1 text-slate-300">{p.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Request Body */}
                  {ep.bodySample && (
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-xs font-semibold text-slate-300">Sample Body ({ep.bodyType.toUpperCase()})</h4>
                      <pre className="p-3 bg-forge-bg border border-forge-border rounded font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed">
                        {ep.bodySample}
                      </pre>
                    </div>
                  )}

                  {/* Assertions */}
                  {ep.assertions && ep.assertions.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-xs font-semibold text-slate-300">Expected Contract Assertions</h4>
                      <ul className="list-disc list-inside text-xs text-slate-400 font-mono space-y-0.5">
                        {ep.assertions.map((a, idx) => (
                          <li key={idx}>
                            <span className="text-slate-300">{a.type}</span>
                            {a.field ? ` [${a.field}]` : ''} == <span className="text-cyan-400">{a.expected}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentationViewer;
