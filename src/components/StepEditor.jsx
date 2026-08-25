import { STEP_TYPES } from '../lib/model.js'
import TagInput from './TagInput.jsx'

// 中部：步骤列表（可拖拽/按钮排序）+ 选中步骤的编辑表单
export default function StepEditor({
  flow,
  selectedStepId,
  onSelectStep,
  onAddStep,
  onDuplicateStep,
  onDeleteStep,
  onMoveStep,
  onReorderStep,
  onUpdateStep,
}) {
  const steps = flow.steps
  const selected = steps.find((s) => s.id === selectedStepId) ?? null

  const handleDrop = (e, targetId) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('text/step-id')
    if (sourceId && sourceId !== targetId) onReorderStep(sourceId, targetId)
  }

  return (
    <section className="step-editor">
      <div className="panel">
        <div className="panel-header">
          <h3>步骤</h3>
          <button className="btn primary" onClick={onAddStep}>+ 新增步骤</button>
        </div>
        {steps.length === 0 && <p className="empty">点击「新增步骤」添加第一个步骤。</p>}
        <ul className="step-list">
          {steps.map((s, i) => (
            <li
              key={s.id}
              className={`step-item ${s.id === selectedStepId ? 'active' : ''} ${s.critical ? 'critical' : ''}`}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/step-id', s.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, s.id)}
              onClick={() => onSelectStep(s.id)}
            >
              <span className="step-order">{i + 1}</span>
              <div className="step-item-main">
                <div className="step-item-name">
                  {s.critical && <span className="badge critical">关键</span>}
                  {s.name || '(未命名步骤)'}
                </div>
                <div className="step-item-meta">
                  {s.type} · {s.duration} 分钟 · 依赖 {s.deps.length} 步
                </div>
              </div>
              <div className="step-item-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn small" disabled={i === 0} onClick={() => onMoveStep(s.id, -1)} title="上移">↑</button>
                <button className="btn small" disabled={i === steps.length - 1} onClick={() => onMoveStep(s.id, 1)} title="下移">↓</button>
                <button className="btn small" onClick={() => onDuplicateStep(s.id)} title="复制步骤">⧉</button>
                <button
                  className="btn small danger"
                  title="删除步骤"
                  onClick={() => {
                    if (confirm(`删除步骤「${s.name || '未命名'}」？`)) onDeleteStep(s.id)
                  }}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel step-form-panel">
        <div className="panel-header"><h3>步骤编辑</h3></div>
        {!selected ? (
          <p className="empty">在左侧选择一个步骤进行编辑。</p>
        ) : (
          <div className="step-form">
            <label>
              步骤名
              <input
                value={selected.name}
                placeholder="例如：酯化反应"
                onChange={(e) => onUpdateStep(selected.id, { name: e.target.value })}
              />
            </label>
            <div className="form-row">
              <label>
                步骤类型
                <select
                  value={selected.type}
                  onChange={(e) => onUpdateStep(selected.id, { type: e.target.value })}
                >
                  {STEP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>
                预计耗时（分钟）
                <input
                  type="number"
                  min="0"
                  value={selected.duration}
                  onChange={(e) => onUpdateStep(selected.id, { duration: Number(e.target.value) })}
                />
              </label>
            </div>
            <label>
              输入材料（回车或逗号添加，点击标签删除）
              <TagInput
                value={selected.inputs}
                placeholder="例如：乙醇、浓硫酸"
                onChange={(inputs) => onUpdateStep(selected.id, { inputs })}
              />
            </label>
            <label>
              输出结果
              <TagInput
                value={selected.outputs}
                placeholder="例如：乙酸乙酯粗产物"
                onChange={(outputs) => onUpdateStep(selected.id, { outputs })}
              />
            </label>
            <label>
              依赖步骤（本步骤开始前必须先完成的步骤）
              <div className="deps-box">
                {steps.filter((s) => s.id !== selected.id).length === 0 && (
                  <span className="empty">没有其他步骤可选。</span>
                )}
                {steps.filter((s) => s.id !== selected.id).map((s) => (
                  <label key={s.id} className="dep-option">
                    <input
                      type="checkbox"
                      checked={selected.deps.includes(s.id)}
                      onChange={(e) => {
                        const deps = e.target.checked
                          ? [...selected.deps, s.id]
                          : selected.deps.filter((d) => d !== s.id)
                        onUpdateStep(selected.id, { deps })
                      }}
                    />
                    {s.name || '(未命名步骤)'}
                  </label>
                ))}
              </div>
            </label>
            <label className="critical-toggle">
              <input
                type="checkbox"
                checked={selected.critical}
                onChange={(e) => onUpdateStep(selected.id, { critical: e.target.checked })}
              />
              标记为关键步骤（关键步骤必须填写注意事项）
            </label>
            <label>
              注意事项
              <textarea
                rows={4}
                value={selected.notes}
                placeholder="温度控制、安全防护、常见失败原因……"
                onChange={(e) => onUpdateStep(selected.id, { notes: e.target.value })}
              />
            </label>
          </div>
        )}
      </div>
    </section>
  )
}
