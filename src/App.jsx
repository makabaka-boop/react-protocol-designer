import React from 'react'
import { useProtocol } from './context/ProtocolContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import StepList from './components/StepList.jsx'
import StepEditor from './components/StepEditor.jsx'
import DependencyGraph from './components/DependencyGraph.jsx'
import ValidationPanel from './components/ValidationPanel.jsx'

export default function App() {
  const { activeProtocol } = useProtocol()

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧪 实验流程设计器</h1>
        <span className="tagline">纯前端 · 本地存储 · 无需后端</span>
      </header>
      <div className="app-body">
        <Sidebar />
        {activeProtocol ? (
          <main className="workspace">
            <section className="panel step-list-panel">
              <StepList />
            </section>
            <section className="panel step-editor-panel">
              <StepEditor />
            </section>
            <section className="panel graph-panel">
              <DependencyGraph />
            </section>
            <section className="panel validation-panel">
              <ValidationPanel />
            </section>
          </main>
        ) : (
          <main className="workspace empty">
            <div className="empty-hint">
              <p>还没有流程。点击左侧「+ 新建流程」开始设计吧。</p>
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
