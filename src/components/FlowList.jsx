// 左侧边栏：流程列表
export default function FlowList({ flows, activeId, onSelect, onCreate, onDelete }) {
  return (
    <aside className="flow-list">
      <div className="flow-list-header">
        <h2>流程列表</h2>
        <button className="btn primary" onClick={onCreate}>+ 新建流程</button>
      </div>
      {flows.length === 0 && <p className="empty">还没有流程，点击「新建流程」开始设计。</p>}
      <ul>
        {flows.map((f) => (
          <li
            key={f.id}
            className={f.id === activeId ? 'active' : ''}
            onClick={() => onSelect(f.id)}
          >
            <div className="flow-item-name">{f.name || '未命名流程'}</div>
            <div className="flow-item-meta">
              {f.steps.length} 个步骤 · {new Date(f.updatedAt).toLocaleString('zh-CN')}
              <button
                className="btn danger small"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`删除流程「${f.name}」？`)) onDelete(f.id)
                }}
              >
                删除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}
