import { formatTime } from '../model.js'

// 草稿箱：查看 / 恢复 / 删除已保存的草稿快照
export default function DraftModal({ open, drafts, onClose, onRestore, onDelete }) {
  if (!open) return null

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>草稿箱</h3>
          <button className="icon-btn" onClick={onClose} title="关闭">
            ✕
          </button>
        </div>
        <div className="modal-body">
          {drafts.length === 0 && (
            <div className="empty-hint">
              还没有保存过草稿。点击顶部「保存草稿」可将当前步骤列表存为快照，随时恢复。
            </div>
          )}
          {drafts.map((draft) => (
            <div key={draft.id} className="draft-item">
              <div className="draft-info">
                <div className="draft-name">{draft.name}</div>
                <div className="draft-meta">
                  <span>{draft.steps.length} 个步骤</span>
                  <span>保存于 {formatTime(draft.savedAt)}</span>
                </div>
              </div>
              <div className="draft-actions">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => onRestore(draft.id)}
                >
                  恢复
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => onDelete(draft.id)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
