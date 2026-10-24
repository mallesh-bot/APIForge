import React, { useState } from 'react';
import { Variable, Plus, Trash2, Lock, Unlock, Check, Globe } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { useEnvironment } from '../../context/EnvironmentContext';
import { api } from '../../services/api';

export function EnvironmentManager() {
  const { environments, activeEnvironmentId, selectEnvironment, refreshEnvironments } = useEnvironment();

  const [selectedEnvId, setSelectedEnvId] = useState(activeEnvironmentId || environments[0]?._id || '');
  const [editingVariables, setEditingVariables] = useState([]);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Environment Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [creating, setCreating] = useState(false);

  const currentEnv = environments.find((e) => e._id === selectedEnvId) || null;

  // When selected environment changes, load its variables into edit state
  React.useEffect(() => {
    if (currentEnv) {
      setEditingName(currentEnv.name);
      setEditingVariables(
        (currentEnv.variables || []).map((v) => ({
          key: v.key,
          value: v.value,
          isSecret: Boolean(v.isSecret),
        }))
      );
    } else if (environments.length > 0 && !selectedEnvId) {
      setSelectedEnvId(environments[0]._id);
    }
  }, [selectedEnvId, currentEnv, environments]);

  const handleAddVariable = () => {
    setEditingVariables([...editingVariables, { key: '', value: '', isSecret: false }]);
  };

  const handleUpdateVariable = (index, field, val) => {
    const updated = [...editingVariables];
    updated[index] = { ...updated[index], [field]: val };
    setEditingVariables(updated);
  };

  const handleDeleteVariable = (index) => {
    setEditingVariables(editingVariables.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!currentEnv) return;
    setSaving(true);
    try {
      const res = await api.patch(`/environments/${currentEnv._id}`, {
        name: editingName.trim(),
        variables: editingVariables.filter((v) => v.key.trim()),
      });
      if (res.data?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        refreshEnvironments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save environment');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateEnvironment = async () => {
    if (!newEnvName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/environments', {
        name: newEnvName.trim(),
        variables: [
          { key: 'baseUrl', value: 'http://localhost:5000/api/v1/mock/shopkart', isSecret: false },
        ],
      });
      if (res.data?.success) {
        setNewEnvName('');
        setIsCreateModalOpen(false);
        await refreshEnvironments();
        setSelectedEnvId(res.data.environment._id);
      }
    } catch (err) {
      alert('Failed to create environment');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEnvironment = async () => {
    if (!currentEnv) return;
    if (!confirm(`Are you sure you want to delete environment "${currentEnv.name}"?`)) return;

    try {
      await api.delete(`/environments/${currentEnv._id}`);
      await refreshEnvironments();
      setSelectedEnvId('');
    } catch (err) {
      alert('Failed to delete environment');
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-forge-card border border-forge-border rounded-lg overflow-hidden">
      {/* Environments List Sidebar */}
      <div className="w-full md:w-64 bg-forge-sidebar/60 border-b md:border-b-0 md:border-r border-forge-border p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between pb-2 border-b border-forge-border">
          <span className="text-xs font-semibold text-slate-300">Environments</span>
          <Button
            size="xs"
            variant="ghost"
            icon={Plus}
            onClick={() => setIsCreateModalOpen(true)}
            title="Create environment"
          >
            New
          </Button>
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto">
          {environments.map((env) => {
            const isSelected = env._id === selectedEnvId;
            const isActive = env._id === activeEnvironmentId;

            return (
              <div
                key={env._id}
                onClick={() => setSelectedEnvId(env._id)}
                className={`flex items-center justify-between px-3 py-2 rounded text-xs cursor-pointer transition ${
                  isSelected
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-forge-hover'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate font-medium">{env.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" title="Currently Active"></span>
                  )}
                </div>
              </div>
            );
          })}

          {environments.length === 0 && (
            <p className="text-[11px] text-slate-500 italic p-2 text-center">No environments created.</p>
          )}
        </div>
      </div>

      {/* Variables Editor Area */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        {currentEnv ? (
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-forge-border">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="bg-transparent font-semibold text-sm text-slate-100 border-b border-transparent hover:border-forge-border focus:border-cyan-500 focus:outline-none px-1 py-0.5"
                />
                {currentEnv._id === activeEnvironmentId ? (
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-950/70 border border-cyan-800 text-cyan-300 rounded">
                    Active
                  </span>
                ) : (
                  <button
                    onClick={() => selectEnvironment(currentEnv._id)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Set as Active
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="ghost"
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                  icon={Trash2}
                  onClick={handleDeleteEnvironment}
                >
                  Delete
                </Button>
                <Button
                  size="xs"
                  variant="primary"
                  loading={saving}
                  icon={saveSuccess ? Check : null}
                  onClick={handleSave}
                >
                  {saveSuccess ? 'Saved!' : 'Save Variables'}
                </Button>
              </div>
            </div>

            {/* Variable Explanation */}
            <p className="text-xs text-slate-400">
              Reference variables anywhere in URLs, headers, or payloads using <code className="text-cyan-400 font-mono">{'{{variableName}}'}</code>.
              Variables marked with a lock are encrypted at rest with AES-256-GCM.
            </p>

            {/* Variables Table */}
            <div className="border border-forge-border rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-forge-input text-slate-400 border-b border-forge-border font-medium">
                  <tr>
                    <th className="px-3 py-2 w-1/3">Variable Key</th>
                    <th className="px-3 py-2">Value</th>
                    <th className="px-3 py-2 w-20 text-center">Secret</th>
                    <th className="px-2 py-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forge-border font-mono text-xs">
                  {editingVariables.map((v, idx) => (
                    <tr key={idx} className="hover:bg-forge-hover/50">
                      <td className="p-1">
                        <input
                          type="text"
                          value={v.key || ''}
                          onChange={(e) => handleUpdateVariable(idx, 'key', e.target.value)}
                          placeholder="e.g. baseUrl"
                          className="w-full bg-transparent px-2.5 py-1 text-slate-200 focus:outline-none focus:bg-forge-input rounded"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type={v.isSecret && v.value === '********' ? 'password' : 'text'}
                          value={v.value || ''}
                          onChange={(e) => handleUpdateVariable(idx, 'value', e.target.value)}
                          placeholder={v.isSecret ? '••••••••' : 'value'}
                          className="w-full bg-transparent px-2.5 py-1 text-slate-200 focus:outline-none focus:bg-forge-input rounded"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleUpdateVariable(idx, 'isSecret', !v.isSecret)}
                          className={`p-1.5 rounded transition ${
                            v.isSecret
                              ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title={v.isSecret ? 'Encrypted secret' : 'Plaintext variable'}
                        >
                          {v.isSecret ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteVariable(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/20"
                          title="Remove variable"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {editingVariables.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-500 italic">
                        No variables defined in this environment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleAddVariable}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 py-1 px-2 rounded hover:bg-cyan-950/20 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Variable
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-slate-500">
            <Variable className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">Select or create an environment</p>
          </div>
        )}
      </div>

      {/* New Environment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Environment"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Environment Name"
            value={newEnvName}
            onChange={(e) => setNewEnvName(e.target.value)}
            placeholder="e.g. Staging, Production, Local"
            autoFocus
          />

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={creating}
              disabled={!newEnvName.trim()}
              onClick={handleCreateEnvironment}
            >
              Create Environment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default EnvironmentManager;
