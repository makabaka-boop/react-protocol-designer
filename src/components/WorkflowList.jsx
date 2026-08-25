import { formatTime } from '../model.js'

export default function WorkflowList({ workflows, activeId, onSelect, onCreate, onDelete }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>流程列表</h2>
        <button className="btn btn-primary btn-sm" onClick={onCreate} title="新建流程">
          ＋ 新建
        </button>
      </div>
      <div className="workflow-list">
        {workflows.map((wf) => {
          const active = wf.id === activeId
          return (
            <div
              key={wf.id}
              className={`workflow-item ${active ? 'active' : ''}`}
              onClick={() => onSelect(wf.id)}
            >
              <div className="workflow-item-name" title={wf.name}>
                {wf.name || '未命名流程'}
              </div>
              <div className="workflow-item-meta">
                <span>{wf.steps.length} 个步骤</span>
                <span>{formatTime(wf.updatedAt)}</span>
              </div>
              <button
                className="icon-btn workflow-del"
                title="删除流程"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm(`确定删除流程「${wf.name}」吗？此操作不可恢复。`)) {
                    onDelete(wf.id)
                  }
                }}
              >
                ✕
              </button>
            </div>
          )
        })}
        {workflows.length === 0 && <div className="empty-hint">还没有流程，点击「新建」开始</div>}
      </div>
      <div className="sidebar-footer">
        <span className="save-tip">数据自动保存在浏览器本地存储</span>
      </div>
    </aside>
  )
}
