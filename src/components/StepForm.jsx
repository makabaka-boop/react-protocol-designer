import { useState } from 'react'
import { STEP_TYPES, DURATION_UNITS } from '../model.js'
import { wouldCreateCycle } from '../validation.js'
import TagInput from './TagInput.jsx'

function initialDuration(durationMin) {
  const min = Number(durationMin) || 0
  if (min > 0 && min % (60 * 24) === 0) return { value: min / (60 * 24), unit: 'day' }
  if (min > 0 && min % 60 === 0) return { value: min / 60, unit: 'h' }
  return { value: min, unit: 'min' }
}

// 步骤编辑表单：父组件以 key={step.id} 渲染，切换步骤时本地状态自动重置
export default function StepForm({ step, steps, issues, onChange, onToggleDep }) {
  const init = initialDuration(step.durationMin)
  const [durValue, setDurValue] = useState(init.value)
  const [durUnit, setDurUnit] = useState(init.unit)

  const commitDuration = (value, unit) => {
    const f = DURATION_UNITS.find((u) => u.value === unit)?.factor ?? 1
    const num = Number(value)
    onChange({ durationMin: num > 0 ? Math.round(num * f) : 0 })
  }

  // 切换单位：实际时长（分钟数）保持不变，只把显示值换算到新单位
  const handleUnitChange = (newUnit) => {
    const oldFactor = DURATION_UNITS.find((u) => u.value === durUnit)?.factor ?? 1
    const newFactor = DURATION_UNITS.find((u) => u.value === newUnit)?.factor ?? 1
    const num = Number(durValue)
    setDurUnit(newUnit)
    if (num > 0) {
      const totalMin = Math.round(num * oldFactor)
      setDurValue(Number((totalMin / newFactor).toFixed(4)))
      onChange({ durationMin: totalMin })
    }
  }

  const otherSteps = steps.filter((s) => s.id !== step.id)

  return (
    <div className="step-form">
      <div className="panel-header">
        <h3>步骤编辑</h3>
        <button
          className={`btn btn-sm ${step.isKey ? 'btn-key-active' : 'btn-key'}`}
          onClick={() => onChange({ isKey: !step.isKey })}
          title="标记/取消关键步骤"
        >
          {step.isKey ? '★ 关键步骤' : '☆ 标记为关键步骤'}
        </button>
      </div>

      {issues.length > 0 && (
        <div className="form-issue-box">
          {issues.map((i) => (
            <div key={i.id} className={`form-issue form-issue-${i.severity}`}>
              {i.severity === 'error' ? '✕' : '⚠'} {i.message}
            </div>
          ))}
        </div>
      )}

      <div className="form-grid">
        <label className="form-field span-2">
          <span className="field-label">步骤名</span>
          <input
            type="text"
            value={step.name}
            placeholder="例如：加样与孵育"
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </label>

        <label className="form-field">
          <span className="field-label">步骤类型</span>
          <select value={step.type} onChange={(e) => onChange({ type: e.target.value })}>
            {STEP_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span className="field-label">预计耗时</span>
          <div className="duration-row">
            <input
              type="number"
              min="0"
              value={durValue}
              onChange={(e) => {
                setDurValue(e.target.value)
                commitDuration(e.target.value, durUnit)
              }}
            />
            <select
              value={durUnit}
              onChange={(e) => handleUnitChange(e.target.value)}
            >
              {DURATION_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </label>

        <div className="form-field span-2">
          <span className="field-label">输入材料</span>
          <TagInput
            items={step.inputMaterials}
            onChange={(list) => onChange({ inputMaterials: list })}
            placeholder="输入材料名称，回车添加"
          />
        </div>

        <div className="form-field span-2">
          <span className="field-label">输出结果</span>
          <TagInput
            items={step.outputResults}
            onChange={(list) => onChange({ outputResults: list })}
            placeholder="输入产出物 / 结果名称，回车添加"
          />
        </div>

        <label className="form-field span-2">
          <span className="field-label">注意事项</span>
          <textarea
            rows={3}
            value={step.notes}
            placeholder="记录操作要点、安全提醒、易错点等（关键步骤必填）"
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </label>

        <div className="form-field span-2">
          <span className="field-label">依赖步骤（勾选后，本步骤需在所选步骤完成后进行）</span>
          <div className="dep-options">
            {otherSteps.length === 0 && <span className="tag-placeholder">暂无其他步骤</span>}
            {otherSteps.map((other) => {
              const checked = step.dependencies.includes(other.id)
              const blocked = !checked && wouldCreateCycle(steps, step.id, other.id)
              return (
                <label
                  key={other.id}
                  className={`dep-option ${blocked ? 'blocked' : ''} ${checked ? 'checked' : ''}`}
                  title={blocked ? '选择该依赖会形成循环依赖，已禁止' : undefined}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={blocked}
                    onChange={(e) => onToggleDep(other.id, e.target.checked)}
                  />
                  {other.isKey && <span className="key-star">★</span>}
                  <span>{other.name || '未命名步骤'}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
