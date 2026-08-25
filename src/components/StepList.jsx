import { useProtocol } from '../context/ProtocolContext';
import { STEP_TYPE_MAP } from '../types';

export default function StepList() {
  const {
    currentProtocol,
    selectedStepId,
    setSelectedStepId,
    addStep,
    deleteStep,
    duplicateStep,
    moveStep,
    toggleCritical,
    validation,
  } = useProtocol();

  if (!currentProtocol) {
    return (
      <div className="step-list empty-state">
        <p>请先选择或创建一个流程</p>
      </div>
    );
  }

  const issuesByStep = validation.issues.reduce((acc, issue) => {
    if (issue.stepId) {
      if (!acc[issue.stepId]) acc[issue.stepId] = [];
      acc[issue.stepId].push(issue);
    }
    return acc;
  }, {});

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, toIndex) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      moveStep(fromIndex, toIndex);
    }
  };

  const moveUp = (index) => {
    if (index > 0) moveStep(index, index - 1);
  };

  const moveDown = (index) => {
    if (index < currentProtocol.steps.length - 1) moveStep(index, index + 1);
  };

  return (
    <div className="step-list">
      <div className="step-list-header">
        <h3>步骤列表</h3>
        <button className="btn btn-primary btn-sm" onClick={addStep}>
          + 添加步骤
        </button>
      </div>
      {currentProtocol.steps.length === 0 ? (
        <div className="empty-state-small">
          <p>暂无步骤，点击"添加步骤"开始设计</p>
        </div>
      ) : (
        <ol className="step-items">
          {currentProtocol.steps.map((step, index) => {
            const isSelected = step.id === selectedStepId;
            const issues = issuesByStep[step.id] || [];
            const errorCount = issues.filter((i) => i.severity === 'error').length;
            const warningCount = issues.filter((i) => i.severity === 'warning').length;
            return (
              <li
                key={step.id}
                className={`step-item ${isSelected ? 'selected' : ''} ${step.isCritical ? 'critical' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => setSelectedStepId(step.id)}
              >
                <div className="step-item-drag">⠿</div>
                <div className="step-item-index">{index + 1}</div>
                <div className="step-item-content">
                  <div className="step-item-title">
                    {step.isCritical && <span className="critical-marker" title="关键步骤">★</span>}
                    <span className="step-item-name">{step.name || '(未命名)'}</span>
                  </div>
                  <div className="step-item-meta">
                    <span className="step-type-tag">{STEP_TYPE_MAP[step.type] || step.type}</span>
                    <span className="step-time">⏱ {step.estimatedMinutes} 分钟</span>
                    {step.dependencies?.length > 0 && (
                      <span className="step-deps" title={`依赖 ${step.dependencies.length} 个步骤`}>
                        🔗 {step.dependencies.length}
                      </span>
                    )}
                    {(errorCount > 0 || warningCount > 0) && (
                      <span
                        className={`step-issue-badge ${errorCount > 0 ? 'has-error' : 'has-warning'}`}
                      >
                        {errorCount > 0 ? `● ${errorCount}` : `◐ ${warningCount}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="step-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className={`btn-icon ${step.isCritical ? 'active' : ''}`}
                    title={step.isCritical ? '取消关键步骤' : '标记为关键步骤'}
                    onClick={() => toggleCritical(step.id)}
                  >
                    ★
                  </button>
                  <button className="btn-icon" title="上移" onClick={() => moveUp(index)} disabled={index === 0}>
                    ↑
                  </button>
                  <button
                    className="btn-icon"
                    title="下移"
                    onClick={() => moveDown(index)}
                    disabled={index === currentProtocol.steps.length - 1}
                  >
                    ↓
                  </button>
                  <button className="btn-icon" title="复制" onClick={() => duplicateStep(step.id)}>
                    ⧉
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    title="删除"
                    onClick={() => {
                      if (confirm('确定删除该步骤？')) deleteStep(step.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
