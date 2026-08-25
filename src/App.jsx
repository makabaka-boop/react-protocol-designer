import { useEffect, useMemo, useState } from 'react'
import { loadState, saveState } from './storage.js'
import { createStep, createWorkflow, createDraft, cloneStep, formatDuration } from './model.js'
import { validateWorkflow, wouldCreateCycle } from './validation.js'
import WorkflowList from './components/WorkflowList.jsx'
import StepList from './components/StepList.jsx'
import StepForm from './components/StepForm.jsx'
import DependencyGraph from './components/DependencyGraph.jsx'
import ValidationPanel from './components/ValidationPanel.jsx'
import DraftModal from './components/DraftModal.jsx'

const EMPTY_VALIDATION = { issues: [], errorCount: 0, warningCount: 0, cycles: [] }

export default function App() {
  const [state, setState] = useState(loadState)
  const [draftOpen, setDraftOpen] = useState(false)
  const [savedAt, setSavedAt] = useState(null)

  // 任何变更都自动持久化到 localStorage
  useEffect(() => {
    saveState(state)
    setSavedAt(new Date())
  }, [state])

  const workflow =
    state.workflows.find((w) => w.id === state.activeWorkflowId) || null
  const steps = workflow?.steps ?? []
  const selectedStep = steps.find((s) => s.id === state.selectedStepId) || null

  const validation = useMemo(
    () => (workflow ? validateWorkflow(workflow) : EMPTY_VALIDATION),
    [workflow]
  )

  const issuesByStep = useMemo(() => {
    const map = new Map()
    for (const issue of validation.issues) {
      if (!issue.stepId) continue
      if (!map.has(issue.stepId)) map.set(issue.stepId, [])
      map.get(issue.stepId).push(issue)
    }
    return map
  }, [validation])

  const totalDuration = useMemo(
    () => steps.reduce((sum, s) => sum + (Number(s.durationMin) || 0), 0),
    [steps]
  )

  // ---------- 流程级操作 ----------
  const updateWorkflow = (patch, wfId = state.activeWorkflowId) => {
    setState((prev) => ({
      ...prev,
      workflows: prev.workflows.map((w) =>
        w.id === wfId ? { ...w, ...patch, updatedAt: Date.now() } : w
      )
    }))
  }

  const handleCreateWorkflow = () => {
    const wf = createWorkflow({ name: `未命名流程 ${state.workflows.length + 1}` })
    setState((prev) => ({
      ...prev,
      workflows: [...prev.workflows, wf],
      activeWorkflowId: wf.id,
      selectedStepId: null
    }))
  }

  const handleDeleteWorkflow = (wfId) => {
    setState((prev) => {
      const remain = prev.workflows.filter((w) => w.id !== wfId)
      return {
        ...prev,
        workflows: remain,
        activeWorkflowId: remain[0]?.id ?? null,
        selectedStepId: null
      }
    })
  }

  const handleSelectWorkflow = (wfId) => {
    setState((prev) => ({ ...prev, activeWorkflowId: wfId, selectedStepId: null }))
  }

  // ---------- 步骤级操作 ----------
  const updateStep = (stepId, patch) => {
    updateWorkflow({
      steps: steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s))
    })
  }

  const handleAddStep = () => {
    const step = createStep({ name: `步骤 ${steps.length + 1}` })
    updateWorkflow({ steps: [...steps, step] })
    setState((prev) => ({ ...prev, selectedStepId: step.id }))
  }

  const handleCopyStep = (stepId) => {
    const idx = steps.findIndex((s) => s.id === stepId)
    if (idx < 0) return
    const copy = cloneStep(steps[idx])
    const next = [...steps]
    next.splice(idx + 1, 0, copy)
    updateWorkflow({ steps: next })
    setState((prev) => ({ ...prev, selectedStepId: copy.id }))
  }

  const handleDeleteStep = (stepId) => {
    updateWorkflow({
      steps: steps
        .filter((s) => s.id !== stepId)
        .map((s) => ({ ...s, dependencies: s.dependencies.filter((d) => d !== stepId) }))
    })
    setState((prev) =>
      prev.selectedStepId === stepId ? { ...prev, selectedStepId: null } : prev
    )
  }

  const handleMoveStep = (index, dir) => {
    const target = index + dir
    if (target < 0 || target >= steps.length) return
    const next = [...steps]
    ;[next[index], next[target]] = [next[target], next[index]]
    updateWorkflow({ steps: next })
  }

  const handleReorder = (from, to) => {
    const next = [...steps]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    updateWorkflow({ steps: next })
  }

  const handleToggleDependency = (stepId, depId, checked) => {
    const step = steps.find((s) => s.id === stepId)
    if (!step) return
    let deps = step.dependencies
    if (checked) {
      if (wouldCreateCycle(steps, stepId, depId)) return // 成环则忽略（表单已禁用）
      if (!deps.includes(depId)) deps = [...deps, depId]
    } else {
      deps = deps.filter((d) => d !== depId)
    }
    updateStep(stepId, { dependencies: deps })
  }

  // ---------- 草稿操作 ----------
  const handleSaveDraft = () => {
    if (!workflow) return
    const defaultName = `草稿 ${new Date().toLocaleString('zh-CN', { hour12: false })}`
    const name = window.prompt('请输入草稿名称：', defaultName)
    if (name === null) return
    const draft = createDraft(workflow, name.trim())
    updateWorkflow({ drafts: [draft, ...workflow.drafts].slice(0, 20) })
    window.alert('草稿已保存，可在「草稿箱」中恢复。')
  }

  const handleRestoreDraft = (draftId) => {
    const draft = workflow.drafts.find((d) => d.id === draftId)
    if (!draft) return
    if (!window.confirm(`恢复草稿「${draft.name}」将覆盖当前步骤列表，确定继续？`)) return
    updateWorkflow({ steps: JSON.parse(JSON.stringify(draft.steps)) })
    setState((prev) => ({ ...prev, selectedStepId: null }))
    setDraftOpen(false)
  }

  const handleDeleteDraft = (draftId) => {
    updateWorkflow({ drafts: workflow.drafts.filter((d) => d.id !== draftId) })
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-title">🧪 实验流程设计器</div>
        {workflow ? (
          <input
            className="wf-name-input"
            value={workflow.name}
            onChange={(e) => updateWorkflow({ name: e.target.value })}
            placeholder="流程名称"
          />
        ) : (
          <div className="header-title-sub">纯前端 · 数据保存在浏览器本地</div>
        )}
        <div className="header-actions">
          <span className="autosave">
            {savedAt
              ? `已自动保存 ${savedAt.toLocaleTimeString('zh-CN', { hour12: false })}`
              : ''}
          </span>
          <button className="btn" onClick={handleSaveDraft} disabled={!workflow}>
            保存草稿
          </button>
          <button className="btn btn-primary" onClick={() => setDraftOpen(true)} disabled={!workflow}>
            草稿箱{workflow && workflow.drafts.length > 0 ? ` (${workflow.drafts.length})` : ''}
          </button>
        </div>
      </header>

      <div className="app-body">
        <WorkflowList
          workflows={state.workflows}
          activeId={state.activeWorkflowId}
          onSelect={handleSelectWorkflow}
          onCreate={handleCreateWorkflow}
          onDelete={handleDeleteWorkflow}
        />

        <main className="main-col">
          {workflow ? (
            <>
              <StepList
                steps={steps}
                selectedId={state.selectedStepId}
                issuesByStep={issuesByStep}
                onSelect={(id) => setState((prev) => ({ ...prev, selectedStepId: id }))}
                onAdd={handleAddStep}
                onCopy={handleCopyStep}
                onDelete={handleDeleteStep}
                onMove={handleMoveStep}
                onReorder={handleReorder}
              />
              <div className="total-duration">
                共 {steps.length} 个步骤，预计总耗时 {formatDuration(totalDuration)}
              </div>
              {selectedStep ? (
                <StepForm
                  key={selectedStep.id}
                  step={selectedStep}
                  steps={steps}
                  issues={issuesByStep.get(selectedStep.id) || []}
                  onChange={(patch) => updateStep(selectedStep.id, patch)}
                  onToggleDep={(depId, checked) =>
                    handleToggleDependency(selectedStep.id, depId, checked)
                  }
                />
              ) : (
                <div className="form-placeholder">
                  点击上方步骤卡片进行编辑，或点击「新增步骤」添加第一个步骤。
                </div>
              )}
            </>
          ) : (
            <div className="empty-hint big">
              没有可编辑的流程，点击左侧「＋ 新建」创建一个实验流程。
            </div>
          )}
        </main>

        <section className="right-col">
          <DependencyGraph
            steps={steps}
            selectedId={state.selectedStepId}
            issuesByStep={issuesByStep}
            cycles={validation.cycles}
            onSelect={(id) => setState((prev) => ({ ...prev, selectedStepId: id }))}
          />
          <ValidationPanel
            validation={validation}
            onSelectStep={(id) => setState((prev) => ({ ...prev, selectedStepId: id }))}
          />
        </section>
      </div>

      <DraftModal
        open={draftOpen}
        drafts={workflow?.drafts ?? []}
        onClose={() => setDraftOpen(false)}
        onRestore={handleRestoreDraft}
        onDelete={handleDeleteDraft}
      />
    </div>
  )
}
