import { useMemo, useState } from 'react'
import FlowList from './components/FlowList.jsx'
import StepEditor from './components/StepEditor.jsx'
import DependencyView from './components/DependencyView.jsx'
import ValidationPanel from './components/ValidationPanel.jsx'
import { createFlow, createStep } from './lib/model.js'
import { loadFlows, saveFlows, hasDraft, clearDraft } from './lib/storage.js'
import { validateFlow } from './lib/validate.js'

export default function App() {
  const [flows, setFlows] = useState(() => loadFlows() ?? [])
  const [activeFlowId, setActiveFlowId] = useState(() => (loadFlows()?.[0]?.id ?? null))
  const [selectedStepId, setSelectedStepId] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState('')

  const flow = flows.find((f) => f.id === activeFlowId) ?? null
  const issues = useMemo(() => (flow ? validateFlow(flow) : []), [flow])
  const cycleStepIds = useMemo(
    () => new Set(issues.filter((i) => i.type === 'cycle').flatMap((i) => i.stepIds)),
    [issues],
  )

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  // 所有修改只改内存中的草稿，标记为未保存
  const mutateFlow = (fn) => {
    setFlows((prev) =>
      prev.map((f) => (f.id === activeFlowId ? { ...fn(f), updatedAt: Date.now() } : f)),
    )
    setDirty(true)
  }

  // ---- 流程操作 ----
  const addFlow = () => {
    const f = createFlow({ name: `实验流程 ${flows.length + 1}` })
    setFlows((prev) => [...prev, f])
    setActiveFlowId(f.id)
    setSelectedStepId(null)
    setDirty(true)
  }

  const deleteFlow = (id) => {
    const idx = flows.findIndex((f) => f.id === id)
    const next = flows.filter((f) => f.id !== id)
    setFlows(next)
    if (id === activeFlowId) {
      // 自动选中相邻流程（优先原位置，即后一个；末尾则选前一个）
      setActiveFlowId(next[Math.min(idx, next.length - 1)]?.id ?? null)
      setSelectedStepId(null)
    }
    setDirty(true)
  }

  // ---- 步骤操作 ----
  const addStep = () =>
    mutateFlow((f) => {
      const step = createStep({ name: `步骤 ${f.steps.length + 1}` })
      setSelectedStepId(step.id)
      return { ...f, steps: [...f.steps, step] }
    })

  const duplicateStep = (id) =>
    mutateFlow((f) => {
      const idx = f.steps.findIndex((s) => s.id === id)
      if (idx < 0) return f
      const src = f.steps[idx]
      // 复制：新 id、名称加副本、清空依赖避免误连，插在原步骤之后
      const copy = createStep({
        ...src,
        id: crypto.randomUUID(),
        name: `${src.name || '步骤'}（副本）`,
        deps: [...src.deps],
      })
      const steps = [...f.steps]
      steps.splice(idx + 1, 0, copy)
      setSelectedStepId(copy.id)
      return { ...f, steps }
    })

  const deleteStep = (id) =>
    mutateFlow((f) => ({
      ...f,
      steps: f.steps
        .filter((s) => s.id !== id)
        .map((s) => ({ ...s, deps: s.deps.filter((d) => d !== id) })),
    }))

  const moveStep = (id, dir) =>
    mutateFlow((f) => {
      const idx = f.steps.findIndex((s) => s.id === id)
      const to = idx + dir
      if (idx < 0 || to < 0 || to >= f.steps.length) return f
      const steps = [...f.steps]
      ;[steps[idx], steps[to]] = [steps[to], steps[idx]]
      return { ...f, steps }
    })

  // 拖拽排序：把 source 插入到 target 的位置
  const reorderStep = (sourceId, targetId) =>
    mutateFlow((f) => {
      const steps = [...f.steps]
      const from = steps.findIndex((s) => s.id === sourceId)
      const to = steps.findIndex((s) => s.id === targetId)
      if (from < 0 || to < 0) return f
      const [moved] = steps.splice(from, 1)
      steps.splice(to, 0, moved)
      return { ...f, steps }
    })

  const updateStep = (id, patch) =>
    mutateFlow((f) => ({
      ...f,
      steps: f.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }))

  // ---- 草稿保存 / 恢复 ----
  const saveDraft = () => {
    saveFlows(flows)
    setDirty(false)
    showToast('草稿已保存到本地存储')
  }

  const restoreDraft = () => {
    const data = loadFlows()
    if (!data) {
      showToast('没有找到已保存的草稿')
      return
    }
    setFlows(data)
    setActiveFlowId(data[0]?.id ?? null)
    setSelectedStepId(null)
    setDirty(false)
    showToast('已恢复上次保存的草稿')
  }

  const discardDraft = () => {
    if (!confirm('清空本地存储中的草稿？当前未保存的修改也会丢失。')) return
    clearDraft()
    setFlows([])
    setActiveFlowId(null)
    setSelectedStepId(null)
    setDirty(false)
    showToast('草稿已清空')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>实验流程设计器</h1>
        <div className="header-actions">
          {dirty && <span className="dirty-dot">● 有未保存修改</span>}
          <button className="btn primary" onClick={saveDraft}>保存草稿</button>
          <button className="btn" onClick={restoreDraft} disabled={!hasDraft()}>恢复草稿</button>
          <button className="btn danger" onClick={discardDraft} disabled={!hasDraft() && flows.length === 0}>
            清空草稿
          </button>
        </div>
      </header>

      <div className="app-body">
        <FlowList
          flows={flows}
          activeId={activeFlowId}
          onSelect={(id) => {
            setActiveFlowId(id)
            setSelectedStepId(null)
          }}
          onCreate={addFlow}
          onDelete={deleteFlow}
        />

        <main className="main">
          {!flow ? (
            <div className="placeholder">请选择或新建一个实验流程。</div>
          ) : (
            <>
              <div className="flow-title">
                <input
                  className="flow-name-input"
                  value={flow.name}
                  onChange={(e) => mutateFlow((f) => ({ ...f, name: e.target.value }))}
                />
                <span className="flow-stat">
                  共 {flow.steps.length} 步 · 预计总耗时{' '}
                  {flow.steps.reduce((sum, s) => sum + (Number(s.duration) || 0), 0)} 分钟
                </span>
              </div>
              <StepEditor
                flow={flow}
                selectedStepId={selectedStepId}
                onSelectStep={setSelectedStepId}
                onAddStep={addStep}
                onDuplicateStep={duplicateStep}
                onDeleteStep={deleteStep}
                onMoveStep={moveStep}
                onReorderStep={reorderStep}
                onUpdateStep={updateStep}
              />
              <div className="bottom-row">
                <DependencyView
                  flow={flow}
                  selectedStepId={selectedStepId}
                  onSelectStep={setSelectedStepId}
                  cycleStepIds={cycleStepIds}
                />
                <ValidationPanel issues={issues} onLocateStep={setSelectedStepId} />
              </div>
            </>
          )}
        </main>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
