import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export function KeyValueEditor({
  pairs = [],
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}) {
  const handleUpdate = (index, field, value) => {
    const updated = [...pairs];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAddRow = () => {
    onChange([...pairs, { key: '', value: '', enabled: true }]);
  };

  const handleDeleteRow = (index) => {
    const updated = pairs.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="border border-forge-border rounded overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-forge-input text-slate-400 border-b border-forge-border">
            <tr>
              <th className="w-10 px-3 py-2 text-center"></th>
              <th className="px-3 py-2 font-medium">{keyPlaceholder}</th>
              <th className="px-3 py-2 font-medium">{valuePlaceholder}</th>
              <th className="w-10 px-2 py-2 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forge-border">
            {pairs.map((row, index) => (
              <tr key={index} className="hover:bg-forge-hover/50">
                <td className="px-3 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={row.enabled ?? true}
                    onChange={(e) => handleUpdate(index, 'enabled', e.target.checked)}
                    className="rounded bg-forge-input border-forge-border text-cyan-500 focus:ring-cyan-500"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    value={row.key || ''}
                    placeholder={keyPlaceholder}
                    onChange={(e) => handleUpdate(index, 'key', e.target.value)}
                    className="w-full bg-transparent px-2.5 py-1 text-slate-200 placeholder-slate-600 font-mono text-xs focus:outline-none focus:bg-forge-input rounded"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    value={row.value || ''}
                    placeholder={valuePlaceholder}
                    onChange={(e) => handleUpdate(index, 'value', e.target.value)}
                    className="w-full bg-transparent px-2.5 py-1 text-slate-200 placeholder-slate-600 font-mono text-xs focus:outline-none focus:bg-forge-input rounded"
                  />
                </td>
                <td className="px-2 py-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(index)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/20"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {pairs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-slate-500 text-xs italic">
                  No parameters defined. Click "Add Row" below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-start">
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 py-1 px-2 rounded hover:bg-cyan-950/20 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Row
        </button>
      </div>
    </div>
  );
}

export default KeyValueEditor;
