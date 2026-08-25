import { useProtocol } from '../context/ProtocolContext';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Toolbar() {
  const {
    currentProtocol,
    renameProtocol,
    updateProtocolDescription,
    saveCurrentDraft,
    restoreDraft,
    discardDraft,
    draftStatus,
  } = useProtocol();

  if (!currentProtocol) return null;

  const hasDraft = draftStatus[currentProtocol.id];
  const totalMinutes = currentProtocol.steps.reduce(
    (sum, s) => sum + (s.estimatedMinutes || 0),
    0
  );
  const criticalCount = currentProtocol.steps.filter((s) => s.isCritical).length;

  const handleSaveDraft = () => {
    saveCurrentDraft();
    alert('草稿已保存到本地存储');
  };

  const handleRestoreDraft = () => {
    if (confirm('确定要恢复上次保存的草稿吗？当前未保存的更改将丢失。')) {
      const ok = restoreDraft();
      if (ok) {
        alert('草稿已恢复');
      } else {
        alert('没有可恢复的草稿');
      }
    }
  };

  const handleDiscardDraft = () => {
    if (confirm('确定删除已保存的草稿吗？')) {
      discardDraft();
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <input
          className="protocol-title-input"
          value={currentProtocol.name}
          onChange={(e) => renameProtocol(currentProtocol.id, e.target.value)}
          placeholder="流程名称"
        />
        <input
          className="protocol-desc-input"
          value={currentProtocol.description || ''}
          onChange={(e) => updateProtocolDescription(currentProtocol.id, e.target.value)}
          placeholder="添加流程描述（可选）"
        />
      </div>
      <div className="toolbar-right">
        <div className="toolbar-stats">
          <span title="步骤总数">{currentProtocol.steps.length} 步</span>
          <span title="预计总耗时">约 {Math.round(totalMinutes / 60 * 10) / 10} 小时</span>
          {criticalCount > 0 && <span className="stat-critical" title="关键步骤数">★ {criticalCount}</span>}
        </div>
        <div className="toolbar-actions">
          {hasDraft && (
            <span className="draft-indicator" title="存在已保存的草稿">
              📝 有草稿
            </span>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleSaveDraft}>
            保存草稿
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleRestoreDraft}
            disabled={!hasDraft}
          >
            恢复草稿
          </button>
          {hasDraft && (
            <button className="btn btn-ghost btn-sm" onClick={handleDiscardDraft}>
              清除草稿
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
