import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { RequestBuilder } from '../request-builder/RequestBuilder';
import { ResponseViewer } from '../request-builder/ResponseViewer';
import { CollectionExplorer } from '../collections/CollectionExplorer';
import { EnvironmentManager } from '../environments/EnvironmentManager';
import { HistoryPanel } from '../history/HistoryPanel';
import { CollectionRunner } from '../testing/CollectionRunner';
import { DocumentationViewer } from '../documentation/DocumentationViewer';
import { Toast } from '../../components/common/Toast';
import { api } from '../../services/api';
import { useEnvironment } from '../../context/EnvironmentContext';

export function WorkspaceLayout() {
  const { refreshEnvironments, selectEnvironment } = useEnvironment();

  const [activeView, setActiveView] = useState('requests');
  const [collections, setCollections] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [currentResponse, setCurrentResponse] = useState(null);
  const [currentAssertions, setCurrentAssertions] = useState([]);
  const [executing, setExecuting] = useState(false);
  const [importingDemo, setImportingDemo] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'info' }), 3500);
  };

  const fetchCollections = useCallback(async () => {
    try {
      const res = await api.get('/collections');
      if (res.data?.success) {
        setCollections(res.data.collections || []);
      }
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // One-click Idempotent Import for ShopKart Demo Collection
  const handleImportShopKartDemo = async () => {
    setImportingDemo(true);
    try {
      const res = await api.post('/collections/import-shopkart-demo');
      if (res.data?.success) {
        await fetchCollections();
        await refreshEnvironments();

        if (res.data.isDuplicate) {
          showToast('ShopKart Demo Collection is already loaded in your workspace', 'info');
        } else {
          showToast(`Successfully imported 18 ShopKart demo endpoints!`, 'success');
          // Automatically switch to the ShopKart environment
          if (res.data.environment?._id) {
            selectEnvironment(res.data.environment._id);
          }
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to import demo collection', 'error');
    } finally {
      setImportingDemo(false);
    }
  };

  const handleSelectRequestFromTree = (req) => {
    setActiveRequest(req);
    setActiveView('requests');
  };

  const handleReplayFromHistory = (historyItem) => {
    setActiveRequest({
      method: historyItem.method,
      url: historyItem.url,
      params: [],
      headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
      auth: { type: 'none' },
      body: { type: 'none', content: '' },
    });
    setActiveView('requests');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-forge-bg overflow-hidden text-slate-100">
      {/* Top Navbar */}
      <TopNav onImportDemo={handleImportShopKartDemo} />

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

        {/* View Surface */}
        <main className="flex-1 flex flex-col p-3 overflow-hidden bg-forge-bg">
          {activeView === 'requests' && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-hidden">
              <div className="flex flex-col overflow-y-auto">
                <RequestBuilder
                  initialRequest={activeRequest}
                  collections={collections}
                  onExecuteStart={() => {
                    setExecuting(true);
                    setCurrentResponse(null);
                  }}
                  onExecuteSuccess={(resp, asserts) => {
                    setExecuting(false);
                    setCurrentResponse(resp);
                    setCurrentAssertions(asserts || []);
                  }}
                  onExecuteError={(errMsg) => {
                    setExecuting(false);
                    showToast(errMsg, 'error');
                  }}
                  onSaveSuccess={(saved) => {
                    fetchCollections();
                    showToast(`Request "${saved.name}" saved successfully`, 'success');
                  }}
                />
              </div>

              <div className="flex flex-col overflow-hidden">
                <ResponseViewer
                  response={currentResponse}
                  assertions={currentAssertions}
                  loading={executing}
                />
              </div>
            </div>
          )}

          {activeView === 'collections' && (
            <CollectionExplorer
              collections={collections}
              onSelectRequest={handleSelectRequestFromTree}
              onRefresh={fetchCollections}
              onImportDemo={handleImportShopKartDemo}
              importingDemo={importingDemo}
            />
          )}

          {activeView === 'environments' && <EnvironmentManager />}

          {activeView === 'history' && (
            <HistoryPanel onReplayRequest={handleReplayFromHistory} />
          )}

          {activeView === 'runner' && <CollectionRunner collections={collections} />}

          {activeView === 'docs' && <DocumentationViewer collections={collections} />}
        </main>
      </div>

      {/* Notifications */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'info' })}
        />
      )}
    </div>
  );
}

export default WorkspaceLayout;
