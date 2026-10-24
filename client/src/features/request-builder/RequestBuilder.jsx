import React, { useState, useEffect } from 'react';
import { Send, Bookmark, Plus, Trash2, Key, Sliders, FileCode, CheckSquare, Layers } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { KeyValueEditor } from '../../components/common/KeyValueEditor';
import { CodeEditor } from '../../components/common/CodeEditor';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { api } from '../../services/api';
import { useEnvironment } from '../../context/EnvironmentContext';

export function RequestBuilder({
  initialRequest,
  onExecuteStart,
  onExecuteSuccess,
  onExecuteError,
  onSaveSuccess,
  collections = [],
}) {
  const { activeEnvironmentId } = useEnvironment();

  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [params, setParams] = useState([]);
  const [headers, setHeaders] = useState([
    { key: 'Accept', value: 'application/json', enabled: true },
  ]);
  const [auth, setAuth] = useState({ type: 'none', token: '', username: '', password: '', apiKeyHeader: 'X-API-Key', apiKeyValue: '' });
  const [body, setBody] = useState({ type: 'none', content: '' });
  const [assertions, setAssertions] = useState([]);

  const [activeTab, setActiveTab] = useState('params');
  const [executing, setExecuting] = useState(false);

  // Save Modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [saving, setSaving] = useState(false);

  // Load incoming request if user clicked from collection or history
  useEffect(() => {
    if (initialRequest) {
      setMethod(initialRequest.method || 'GET');
      setUrl(initialRequest.urlTemplate || initialRequest.url || '');
      setParams(initialRequest.params || []);
      setHeaders(initialRequest.headers || [{ key: 'Accept', value: 'application/json', enabled: true }]);
      setAuth(initialRequest.auth || { type: 'none' });
      setBody(initialRequest.body || { type: 'none', content: '' });
      setAssertions(initialRequest.assertions || []);
      setSaveName(initialRequest.name || '');
      if (initialRequest.collectionId) {
        setSelectedCollectionId(initialRequest.collectionId);
      }
    }
  }, [initialRequest]);

  // Set default collection if modal opens
  useEffect(() => {
    if (collections.length > 0 && !selectedCollectionId) {
      setSelectedCollectionId(collections[0]._id);
    }
  }, [collections, selectedCollectionId]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setExecuting(true);
    onExecuteStart && onExecuteStart();

    try {
      const payload = {
        method,
        url,
        params,
        headers,
        auth,
        body,
        assertions,
        environmentId: activeEnvironmentId || null,
      };

      const res = await api.post('/execute', payload);
      if (res.data?.success) {
        onExecuteSuccess && onExecuteSuccess(res.data.response, res.data.assertions);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      onExecuteError && onExecuteError(errMsg);
    } finally {
      setExecuting(false);
    }
  };

  const handleSaveRequest = async () => {
    if (!saveName.trim() || !selectedCollectionId) return;

    setSaving(true);
    try {
      const payload = {
        collectionId: selectedCollectionId,
        name: saveName.trim(),
        method,
        urlTemplate: url,
        params,
        headers,
        auth,
        body,
        assertions,
      };

      const res = await api.post('/requests', payload);
      if (res.data?.success) {
        onSaveSuccess && onSaveSuccess(res.data.request);
        setIsSaveModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save request');
    } finally {
      setSaving(false);
    }
  };

  const addAssertion = () => {
    setAssertions([
      ...assertions,
      { type: 'STATUS_CODE_EQUALS', expected: '200', field: '' },
    ]);
  };

  const updateAssertion = (index, field, val) => {
    const updated = [...assertions];
    updated[index] = { ...updated[index], [field]: val };
    setAssertions(updated);
  };

  const deleteAssertion = (index) => {
    setAssertions(assertions.filter((_, i) => i !== index));
  };

  const methodColors = {
    GET: 'text-emerald-400 font-bold',
    POST: 'text-cyan-400 font-bold',
    PUT: 'text-amber-400 font-bold',
    PATCH: 'text-purple-400 font-bold',
    DELETE: 'text-rose-400 font-bold',
  };

  return (
    <div className="flex flex-col gap-3 bg-forge-card border border-forge-border rounded-lg p-4">
      {/* Top Bar: Method + URL + Actions */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className={`bg-forge-input border border-forge-border rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan-500 cursor-pointer ${methodColors[method]}`}
        >
          <option value="GET" className="text-emerald-400 font-bold">GET</option>
          <option value="POST" className="text-cyan-400 font-bold">POST</option>
          <option value="PUT" className="text-amber-400 font-bold">PUT</option>
          <option value="PATCH" className="text-purple-400 font-bold">PATCH</option>
          <option value="DELETE" className="text-rose-400 font-bold">DELETE</option>
        </select>

        <div className="flex-1 relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/v1/resource or {{baseUrl}}/products"
            className="w-full bg-forge-input border border-forge-border rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        <Button
          type="submit"
          loading={executing}
          disabled={!url.trim()}
          icon={Send}
          size="md"
          variant="primary"
        >
          Send
        </Button>

        <Button
          type="button"
          onClick={() => setIsSaveModalOpen(true)}
          icon={Bookmark}
          size="md"
          variant="secondary"
          title="Save request to a collection"
        >
          Save
        </Button>
      </form>

      {/* Tabs Bar */}
      <div className="flex items-center border-b border-forge-border text-xs gap-1 mt-1">
        <button
          type="button"
          onClick={() => setActiveTab('params')}
          className={`px-3 py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'params'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Params {params.filter((p) => p.key).length > 0 && `(${params.filter((p) => p.key).length})`}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('headers')}
          className={`px-3 py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'headers'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Headers {headers.filter((h) => h.key).length > 0 && `(${headers.filter((h) => h.key).length})`}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('auth')}
          className={`px-3 py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'auth'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          Auth {auth.type !== 'none' && `(${auth.type})`}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('body')}
          className={`px-3 py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'body'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          Body {body.type !== 'none' && `(${body.type})`}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assertions')}
          className={`px-3 py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'assertions'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Tests {assertions.length > 0 && `(${assertions.length})`}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="py-2">
        {activeTab === 'params' && (
          <KeyValueEditor
            pairs={params}
            onChange={setParams}
            keyPlaceholder="Parameter"
            valuePlaceholder="Value"
          />
        )}

        {activeTab === 'headers' && (
          <KeyValueEditor
            pairs={headers}
            onChange={setHeaders}
            keyPlaceholder="Header"
            valuePlaceholder="Value"
          />
        )}

        {activeTab === 'auth' && (
          <div className="flex flex-col gap-3 max-w-lg">
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-400 font-medium">Type:</label>
              <select
                value={auth.type}
                onChange={(e) => setAuth({ ...auth, type: e.target.value })}
                className="bg-forge-input border border-forge-border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="none">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="apikey">API Key Header</option>
              </select>
            </div>

            {auth.type === 'bearer' && (
              <Input
                label="Bearer Token"
                mono
                value={auth.token || ''}
                onChange={(e) => setAuth({ ...auth, token: e.target.value })}
                placeholder="token_xyz or {{authToken}}"
                helperText="Variable interpolation like {{authToken}} is supported"
              />
            )}

            {auth.type === 'basic' && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Username"
                  value={auth.username || ''}
                  onChange={(e) => setAuth({ ...auth, username: e.target.value })}
                  placeholder="admin"
                />
                <Input
                  label="Password"
                  type="password"
                  value={auth.password || ''}
                  onChange={(e) => setAuth({ ...auth, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            )}

            {auth.type === 'apikey' && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Header Name"
                  mono
                  value={auth.apiKeyHeader || ''}
                  onChange={(e) => setAuth({ ...auth, apiKeyHeader: e.target.value })}
                  placeholder="X-API-Key"
                />
                <Input
                  label="Header Value"
                  mono
                  value={auth.apiKeyValue || ''}
                  onChange={(e) => setAuth({ ...auth, apiKeyValue: e.target.value })}
                  placeholder="key_secret_123"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'body' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-400 font-medium">Body Type:</label>
              <div className="flex items-center gap-4 text-xs text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bodyType"
                    value="none"
                    checked={body.type === 'none'}
                    onChange={() => setBody({ ...body, type: 'none' })}
                  />
                  <span>None</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bodyType"
                    value="json"
                    checked={body.type === 'json'}
                    onChange={() => setBody({ ...body, type: 'json' })}
                  />
                  <span>JSON</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bodyType"
                    value="raw"
                    checked={body.type === 'raw'}
                    onChange={() => setBody({ ...body, type: 'raw' })}
                  />
                  <span>Raw Text</span>
                </label>
              </div>
            </div>

            {body.type !== 'none' && (
              <CodeEditor
                value={body.content || ''}
                onChange={(content) => setBody({ ...body, content })}
                language={body.type === 'json' ? 'json' : 'text'}
                placeholder={body.type === 'json' ? '{\n  "key": "value"\n}' : 'Raw payload...'}
              />
            )}
          </div>
        )}

        {activeTab === 'assertions' && (
          <div className="flex flex-col gap-3">
            <div className="border border-forge-border rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-forge-input text-slate-400 border-b border-forge-border">
                  <tr>
                    <th className="px-3 py-2 font-medium">Assertion Type</th>
                    <th className="px-3 py-2 font-medium">Field / Path</th>
                    <th className="px-3 py-2 font-medium">Expected Value</th>
                    <th className="w-10 px-2 py-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forge-border">
                  {assertions.map((rule, idx) => (
                    <tr key={idx} className="hover:bg-forge-hover/50">
                      <td className="p-1">
                        <select
                          value={rule.type}
                          onChange={(e) => updateAssertion(idx, 'type', e.target.value)}
                          className="w-full bg-transparent px-2 py-1 text-slate-200 text-xs focus:outline-none focus:bg-forge-input rounded"
                        >
                          <option value="STATUS_CODE_EQUALS" className="bg-forge-card">Status code equals</option>
                          <option value="STATUS_CODE_IN_RANGE" className="bg-forge-card">Status code in range (e.g. 200-299)</option>
                          <option value="RESPONSE_TIME_BELOW" className="bg-forge-card">Response time below (ms)</option>
                          <option value="HEADER_EXISTS" className="bg-forge-card">Header exists</option>
                          <option value="HEADER_EQUALS" className="bg-forge-card">Header equals / contains</option>
                          <option value="JSON_FIELD_EXISTS" className="bg-forge-card">JSON field exists</option>
                          <option value="JSON_FIELD_EQUALS" className="bg-forge-card">JSON field equals</option>
                          <option value="BODY_CONTAINS" className="bg-forge-card">Body contains string</option>
                        </select>
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={rule.field || ''}
                          onChange={(e) => updateAssertion(idx, 'field', e.target.value)}
                          placeholder="e.g. customer.email"
                          className="w-full bg-transparent px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:bg-forge-input rounded"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={rule.expected || ''}
                          onChange={(e) => updateAssertion(idx, 'expected', e.target.value)}
                          placeholder="Expected value"
                          className="w-full bg-transparent px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:bg-forge-input rounded"
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => deleteAssertion(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {assertions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-slate-500 text-xs italic">
                        No assertions added. Click "Add Assertion" to test status codes or payloads.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={addAssertion}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 py-1 px-2 rounded hover:bg-cyan-950/20 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Assertion
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save Request Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="Save Request to Collection"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Request Name"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="e.g. Get User Profile"
            autoFocus
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-300">Target Collection</label>
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="bg-forge-input border border-forge-border rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              {collections.map((col) => (
                <option key={col._id} value={col._id} className="bg-forge-card text-slate-100">
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setIsSaveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={saving}
              disabled={!saveName.trim() || !selectedCollectionId}
              onClick={handleSaveRequest}
            >
              Save Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default RequestBuilder;
