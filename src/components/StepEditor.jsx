import React from 'react'
import { useProtocol } from '../context/ProtocolContext.jsx'
import { STEP_TYPES, DURATION_UNITS } from '../lib/types.js'
import { validateProtocol } from '../lib/validation.js'
import StringListEditor from './StringListEditor.jsx'

export default function StepEditor() {
  const { activeProtocol, activeStep, updateStep } = useProtocol()

  if (!activeProtocol) return null
  if (!activeStep) {
    return (
      <div className="step-editor empty">
        <div className="panel-head"><h3>步骤编辑</h3></div>
        <p className="muted">从左侧选择一个步骤进行编辑。</p>
      </div>
    )
  }

  const step = activeStep
  const { stepIssues } = validateProtocol(activeProtocol)
  const issues = stepIssues[step.id] || { errors: [], warnings: [] }

  // 直接更新 context 中的步骤，避免本地副本导致的状态不同步
  const set = (patch) => updateStep(step.id, patch)

  // 可选依赖：同一流程中除自身外的其它步骤
  const others = activeProtocol.steps.filter((s) => s.id !== step.id)

  const toggleDep = (id) => {
    const has = step.dependencies.includes(id)
    set({
      dependencies: has
        ? step.dependencies.filter((d) => d !== id)
        : [...step.dependencies, id],
    })
  }

  return (
    <div className="step-editor">
      <div className="panel-head">
        <h3>步骤编辑</h3>
        <label className="key-toggle">
          <input
            type="checkbox"
            checked={step.isKey}
            onChange={(e) => set({ isKey: e.target.checked })}
          />
          标记为关键步骤
        </label>
      </div>

      <div className="editor-grid">
        <label className="field">
          <span>步骤名 *</span>
          <input
            value={step.name}
            placeholder="例如：样品裂解"
            onChange={(e) => set({ name: e.target.value })}
          />
        </label>

        <label className="field">
          <span>步骤类型</span>
          <select value={step.type} onChange={(e) => set({ type: e.target.value })}>
            {STEP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>预计耗时</span>
          <div className="duration-row">
            <input
              type="number"
              min="0"
              value={step.duration.value}
              onChange={(e) =>
                set({ duration: { ...step.duration, value: Number(e.target.value) } })
              }
            />
            <select
              value={step.duration.unit}
              onChange={(e) =>
                // 仅切换单位，不改变数值，避免误换算
                set({ duration: { ...step.duration, unit: e.target.value } })
              }
            >
              {DURATION_UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
        </label>
      </div>

      {/* 输入 / 输出：用 step.id 作为 key，切换步骤时强制重挂载，清空未提交的输入框 */}
      <StringListEditor
        key={`inputs-${step.id}`}
        label="输入材料"
        items={step.inputs}
        placeholder="输入材料后回车或点添加"
        onChange={(inputs) => set({ inputs })}
      />
      <StringListEditor
        key={`outputs-${step.id}`}
        label="输出结果"
        items={step.outputs}
        placeholder="输出结果后回车或点添加"
        onChange={(outputs) => set({ outputs })}
      />

      <label className="field">
        <span>
          注意事项{step.isKey ? ' *（关键步骤必填）' : ''}
        </span>
        <textarea
          rows={3}
          value={step.notes}
          placeholder="操作注意点、风险提示等…"
          onChange={(e) => set({ notes: e.target.value })}
        />
      </label>

      <div className="field">
        <span className="field-label">依赖步骤</span>
        {others.length === 0 ? (
          <p className="muted">当前流程没有其它步骤可依赖。</p>
        ) : (
          <ul className="dep-select">
            {others.map((s, idx) => {
              const globalIdx = activeProtocol.steps.findIndex((x) => x.id === s.id)
              return (
                <li key={s.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={step.dependencies.includes(s.id)}
                      onChange={() => toggleDep(s.id)}
                    />
                    <span className="dep-idx">#{globalIdx + 1}</span>
                    {s.name || '(未命名步骤)'}
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {(issues.errors.length > 0 || issues.warnings.length > 0) && (
        <div className="inline-issues">
          {issues.errors.map((m, i) => (
            <div key={`e${i}`} className="issue error">⛔ {m}</div>
          ))}
          {issues.warnings.map((m, i) => (
            <div key={`w${i}`} className="issue warn">⚠️ {m}</div>
          ))}
        </div>
      )}
    </div>
  )
}
