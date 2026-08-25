import { useState } from 'react';
import { ProtocolProvider } from './context/ProtocolContext';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import StepList from './components/StepList';
import StepEditor from './components/StepEditor';
import DependencyView from './components/DependencyView';
import ValidationPanel from './components/ValidationPanel';
import './App.css';

function Workspace() {
  const [activeTab, setActiveTab] = useState('editor');

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-area">
        <Toolbar />
        <div className="content-grid">
          <div className="left-panel">
            <StepList />
          </div>
          <div className="center-panel">
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
                onClick={() => setActiveTab('editor')}
              >
                步骤编辑
              </button>
              <button
                className={`tab ${activeTab === 'dependencies' ? 'active' : ''}`}
                onClick={() => setActiveTab('dependencies')}
              >
                依赖关系
              </button>
            </div>
            <div className="tab-content">
              {activeTab === 'editor' ? <StepEditor /> : <DependencyView />}
            </div>
          </div>
          <div className="right-panel">
            <ValidationPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ProtocolProvider>
      <Workspace />
    </ProtocolProvider>
  );
}
