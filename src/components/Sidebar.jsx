import { useState } from 'react';
import { useProtocol } from '../context/ProtocolContext';

export default function Sidebar() {
  const {
    protocols,
    currentId,
    selectProtocol,
    createNewProtocol,
    deleteProtocol,
    renameProtocol,
    validation,
    draftStatus,
  } = useProtocol();
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = () => {
    createNewProtocol(`新流程 ${protocols.length + 1}`);
  };

  const startRename = (p) => {
    setEditingId(p.id);
    setEditingName(p.name);
  };

  const commitRename = () => {
    if (editingId && editingName.trim()) {
      renameProtocol(editingId, editingName.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (protocols.length <= 1) {
      alert('至少保留一个流程');
      return;
    }
    if (confirm('确定删除该流程？此操作不可撤销。')) {
      deleteProtocol(id);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>实验流程</h2>
        <button className="btn btn-primary btn-sm" onClick={handleCreate}>
          + 新建
        </button>
      </div>
      <ul className="protocol-list">
        {protocols.map((p) => {
          const isActive = p.id === currentId;
          const hasDraftIssue = isActive && (validation.errorCount > 0 || validation.warningCount > 0);
          const hasDraft = draftStatus[p.id];
          return (
            <li
              key={p.id}
              className={`protocol-item ${isActive ? 'active' : ''}`}
              onClick={() => selectProtocol(p.id)}
            >
              <div className="protocol-item-main">
                {editingId === p.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="protocol-name"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startRename(p);
                    }}
                  >
                    {p.name}
                  </span>
                )}
                <div className="protocol-item-badges">
                  {hasDraft && <span className="badge badge-draft" title="有未恢复的草稿">草稿</span>}
                  {isActive && hasDraftIssue && (
                    <span
                      className={`badge ${validation.errorCount > 0 ? 'badge-error' : 'badge-warning'}`}
                      title={`${validation.errorCount} 错误, ${validation.warningCount} 警告`}
                    >
                      {validation.errorCount > 0
                        ? `${validation.errorCount} 错`
                        : `${validation.warningCount} 警`}
                    </span>
                  )}
                  <span className="step-count">{p.steps.length} 步</span>
                </div>
              </div>
              <div className="protocol-item-actions">
                <button
                  className="btn-icon"
                  title="重命名"
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(p);
                  }}
                >
                  ✎
                </button>
                <button
                  className="btn-icon btn-danger"
                  title="删除"
                  onClick={(e) => handleDelete(e, p.id)}
                >
                  ✕
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="sidebar-tip">
        <p>💡 提示：双击流程名可重命名</p>
      </div>
    </aside>
  );
}
