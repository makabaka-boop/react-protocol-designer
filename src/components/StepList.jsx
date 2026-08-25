import React, { useState } from 'react'
import { useProtocol } from '../context/ProtocolContext.jsx'
import { validateProtocol } from '../lib/validation.js'
import { STEP_TYPES, durationToMinutes } from '../lib/types.js'

const typeLabel = (t) => STEP_TYPES.find((x) => x.value === t)?.label || t

function formatDuration(d) {
  const total = durationToMinutes(d)
  if (total <= 0) return '未设置'
  if (total < 60) return `${total} 分钟`
  if (total < 60 * 24) return `${(total / 60).toFixed(total % 60 ? 1 : 0)} 小时`
  return `${(total / 60 / 24).toFixed(1)} 天`
}

export default function StepList() {
  const {
    activeProtocol,
    state,
    addStep,
    copyStep,
    deleteStep,
    moveStep,
    selectStep,
    saveActiveDraft,
    restoreActiveDraft,
    getDraft,
  } = useProtocol()
  const [toast, setToast] = useState('')

  if (!activeProtocol) return null
  const { stepIssues } = validateProtocol(activeProtocol)
  const steps = activeProtocol.steps
  const draft = getDraft(activeProtocol.id)

  const flash = (msg) => {
    setToast(msg)
    window.clearTimeout(flash._t)
    flash._t = window.setTimeout(() => setToast(''), 2200)
  }

  const handleSaveDraft = () => {
    const ts = saveActiveDraft()
    if (ts) flash('草稿已保存 ✓')
  }
  const handleRestore = () => {
    if (!draft) {
      flash('没有可恢复的草稿')
      return
    }
    if (confirm('恢复草稿将覆盖当前未保存的修改，确定继续？')) {
      const ok = restoreActiveDraft()
      flash(ok ? '已恢复到草稿 ✓' : '恢复失败')
    }
  }

  return (
    <div className="step-list">
      <div className="panel-head">
        <h3>步骤列表</h3>
        <div className="head-actions">
          <button className="btn primary" onClick={() => addStep()}>+ 新增步骤</button>
        </div>
      </div>

      <div className="draft-bar">
        <button className="btn" onClick={handleSaveDraft}>💾 保存草稿</button>
        <button className="btn" onClick={handleRestore} disabled={!draft}>
          ↩️ 恢复草稿
        </button>
        {draft && (
          <span className="draft-time">
            草稿：{new Date(draft.savedAt).toLocaleString('zh-CN')}
          </span>
        )}
        {toast && <span className="toast">{toast}</span>}
      </div>

      <ol className="steps">
        {steps.length === 0 && <li className="muted">还没有步骤，点击「+ 新增步骤」。</li>}
        {steps.map((s, idx) => {
          const issues = stepIssues[s.id] || { errors: [], warnings: [] }
          const active = s.id === state.activeStepId
          return (
            <li
              key={s.id}
              className={`step-card ${active ? 'active' : ''} ${s.isKey ? 'key' : ''}`}
              onClick={() => selectStep(s.id)}
            >
              <div className="step-index">{idx + 1}</div>
              <div className="step-body">
                <div className="step-title">
                  <span className="step-name">{s.name || '(未命名步骤)'}</span>
                  {s.isKey && <span className="key-tag">关键</span>}
                  <span className="type-tag">{typeLabel(s.type)}</span>
                </div>
                <div className="step-sub">
                  ⏱ {formatDuration(s.duration)} · 依赖 {s.dependencies?.length || 0} 个
                </div>
                {(issues.errors.length > 0 || issues.warnings.length > 0) && (
                  <div className="step-flags">
                    {issues.errors.length > 0 && (
                      <span className="badge error">{issues.errors.length} 错误</span>
                    )}
                    {issues.warnings.length > 0 && (
                      <span className="badge warn">{issues.warnings.length} 警告</span>
                    )}
                  </div>
                )}
              </div>
              <div className="step-ops" onClick={(e) => e.stopPropagation()}>
                <button
                  className="icon-btn"
                  title="上移"
                  disabled={idx === 0}
                  onClick={() => moveStep(idx, idx - 1)}
                >▲</button>
                <button
                  className="icon-btn"
                  title="下移"
                  disabled={idx === steps.length - 1}
                  onClick={() => moveStep(idx, idx + 1)}
                >▼</button>
                <button className="icon-btn" title="复制步骤" onClick={() => copyStep(s.id)}>⧉</button>
                <button
                  className="icon-btn danger"
                  title="删除步骤"
                  onClick={() => deleteStep(s.id)}
                >🗑️</button>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
