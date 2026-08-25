import React, { useState } from 'react'
import { useProtocol } from '../context/ProtocolContext.jsx'
import { validateProtocol } from '../lib/validation.js'
import { exportProtocol } from '../lib/storage.js'

export default function Sidebar() {
  const {
    state,
    activeProtocol,
    addProtocol,
    deleteProtocol,
    selectProtocol,
    updateProtocolMeta,
  } = useProtocol()
  const [editingName, setEditingName] = useState('')
  const [renamingId, setRenamingId] = useState(null)

  const startRename = (p) => {
    setRenamingId(p.id)
    setEditingName(p.name)
  }
  const commitRename = () => {
    if (renamingId) {
      updateProtocolMeta(renamingId, { name: editingName.trim() || '未命名流程' })
    }
    setRenamingId(null)
    setEditingName('')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <h2>流程列表</h2>
        <button className="btn primary" onClick={() => addProtocol()}>
          + 新建流程
        </button>
      </div>
      <ul className="protocol-list">
        {state.protocols.length === 0 && (
          <li className="muted">暂无流程</li>
        )}
        {state.protocols.map((p) => {
          const { errors, warnings } = validateProtocol(p)
          const isActive = p.id === state.activeId
          return (
            <li
              key={p.id}
              className={`protocol-item ${isActive ? 'active' : ''}`}
              onClick={() => selectProtocol(p.id)}
            >
              {renamingId === p.id ? (
                <input
                  autoFocus
                  className="rename-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') { setRenamingId(null); setEditingName('') }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="protocol-main">
                  <span className="protocol-name" title={p.name}>{p.name}</span>
                  <span className="protocol-meta">
                    {p.steps.length} 步
                    {errors.length > 0 && <em className="badge error">{errors.length} 错误</em>}
                    {warnings.length > 0 && <em className="badge warn">{warnings.length} 警告</em>}
                  </span>
                </div>
              )}
              <div className="protocol-actions" onClick={(e) => e.stopPropagation()}>
                <button className="icon-btn" title="重命名" onClick={() => startRename(p)}>✏️</button>
                <button className="icon-btn" title="导出 JSON" onClick={() => exportProtocol(p)}>⬇️</button>
                <button
                  className="icon-btn danger"
                  title="删除流程"
                  onClick={() => {
                    if (confirm(`确定删除流程「${p.name}」？此操作不可撤销。`)) {
                      deleteProtocol(p.id)
                    }
                  }}
                >
                  🗑️
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      {activeProtocol && (
        <div className="sidebar-foot">
          <label className="field">
            <span>流程描述</span>
            <textarea
              rows={3}
              value={activeProtocol.description}
              placeholder="简要描述这个实验流程…"
              onChange={(e) =>
                updateProtocolMeta(activeProtocol.id, { description: e.target.value })
              }
            />
          </label>
        </div>
      )}
    </aside>
  )
}
