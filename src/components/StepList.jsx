import { useState } from 'react'
import { formatDuration } from '../model.js'

// 步骤卡片列表：支持点击选中、拖拽 / 按钮调整顺序、复制、删除
export default function StepList({
  steps,
  selectedId,
  issuesByStep,
  onSelect,
  onAdd,
  onCopy,
  onDelete,
  onMove,
  onReorder
}) {
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  const nameOf = (id) => steps.find((s) => s.id === id)?.name || '已删除步骤'

  const handleDrop = (e, index) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== index) {
      onReorder(dragIndex, index)
    }
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div className="step-list-area">
      <div className="step-list-toolbar">
        <button className="btn btn-primary" onClick={onAdd}>
          ＋ 新增步骤
        </button>
        <span className="toolbar-hint">拖动卡片左侧 ⠿ 可调整顺序</span>
      </div>

      <div className="step-cards">
        {steps.map((step, index) => {
          const issues = issuesByStep.get(step.id) || []
          const errors = issues.filter((i) => i.severity === 'error').length
          const warnings = issues.filter((i) => i.severity === 'warning').length
          return (
            <div
              key={step.id}
              className={`step-card ${selectedId === step.id ? 'selected' : ''} ${
                overIndex === index && dragIndex !== index ? 'dragover' : ''
              } ${dragIndex === index ? 'dragging' : ''}`}
              draggable
              onDragStart={(e) => {
                setDragIndex(index)
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', String(index))
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                if (overIndex !== index) setOverIndex(index)
              }}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={() => {
                setDragIndex(null)
                setOverIndex(null)
              }}
              onClick={() => onSelect(step.id)}
            >
              <span className="drag-handle" title="拖拽调整顺序">
                ⠿
              </span>
              <span className="step-index">{index + 1}</span>
              <div className="step-card-main">
                <div className="step-card-title">
                  {step.isKey && <span className="key-star" title="关键步骤">★</span>}
                  <span className="step-card-name">{step.name || '未命名步骤'}</span>
                  {errors > 0 && <span className="dot dot-error" title={`${errors} 个错误`}>{errors}</span>}
                  {warnings > 0 && <span className="dot dot-warning" title={`${warnings} 个警告`}>{warnings}</span>}
                </div>
                <div className="step-card-meta">
                  <span className="type-badge">{step.type}</span>
                  <span>⏱ {formatDuration(step.durationMin)}</span>
                  <span className="step-deps" title={step.dependencies.map(nameOf).join('、')}>
                    {step.dependencies.length > 0
                      ? `依赖：${step.dependencies.map((d) => nameOf(d)).join('、')}`
                      : '无依赖'}
                  </span>
                </div>
              </div>
              <div className="step-card-actions" onClick={(e) => e.stopPropagation()}>
                <button className="icon-btn" title="上移" disabled={index === 0}
                  onClick={() => onMove(index, -1)}>↑</button>
                <button className="icon-btn" title="下移" disabled={index === steps.length - 1}
                  onClick={() => onMove(index, 1)}>↓</button>
                <button className="icon-btn" title="复制步骤" onClick={() => onCopy(step.id)}>
                  ⧉
                </button>
                <button
                  className="icon-btn danger"
                  title="删除步骤"
                  onClick={() => {
                    if (window.confirm(`确定删除步骤「${step.name}」吗？`)) onDelete(step.id)
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
        {steps.length === 0 && (
          <div className="empty-hint big">
            当前流程还没有步骤，点击「新增步骤」开始设计实验流程。
          </div>
        )}
      </div>
    </div>
  )
}
