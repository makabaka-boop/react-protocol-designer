import { useProtocol } from '../context/ProtocolContext';
import { STEP_TYPE_MAP } from '../types';

export default function DependencyView() {
  const { currentProtocol, selectedStepId, setSelectedStepId, toggleDependency, validation } = useProtocol();

  if (!currentProtocol) {
    return (
      <div className="dependency-view empty-state">
        <p>请先选择一个流程</p>
      </div>
    );
  }

  const steps = currentProtocol.steps;

  if (steps.length === 0) {
    return (
      <div className="dependency-view empty-state">
        <p>暂无步骤，请先添加步骤</p>
      </div>
    );
  }

  const hasCycle = validation.issues.some((i) => i.type === 'circular_dependency');

  const isDep = (stepId, depId) => {
    const s = steps.find((x) => x.id === stepId);
    return s?.dependencies?.includes(depId);
  };

  const getStepIndex = (id) => steps.findIndex((s) => s.id === id) + 1;

  return (
    <div className="dependency-view">
      <div className="dependency-header">
        <h3>依赖关系配置</h3>
        <p className="hint">
          勾选单元格表示「行步骤」依赖「列步骤」（即列步骤需先完成）。点击步骤名可在编辑器中打开。
        </p>
        {hasCycle && (
          <div className="alert alert-error">
            ⚠ 当前存在循环依赖，请取消勾选以解除闭环。
          </div>
        )}
      </div>

      <div className="dependency-matrix-wrapper">
        <table className="dependency-matrix">
          <thead>
            <tr>
              <th className="matrix-corner">
                <span>步骤 \\ 依赖</span>
              </th>
              {steps.map((s, i) => (
                <th
                  key={s.id}
                  className={`matrix-col-header ${s.id === selectedStepId ? 'selected' : ''} ${s.isCritical ? 'critical-col' : ''}`}
                  onClick={() => setSelectedStepId(s.id)}
                  title={s.name}
                >
                  <div className="matrix-step-label">
                    <span className="matrix-step-index">{i + 1}</span>
                    <span className="matrix-step-name">{s.name || '(未命名)'}</span>
                    {s.isCritical && <span className="critical-marker">★</span>}
                  </div>
                </th>
              ))}
              <th className="matrix-dep-count">依赖数</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((rowStep, rowIdx) => (
              <tr
                key={rowStep.id}
                className={rowStep.id === selectedStepId ? 'selected-row' : ''}
              >
                <th
                  className={`matrix-row-header ${rowStep.isCritical ? 'critical-row' : ''}`}
                  onClick={() => setSelectedStepId(rowStep.id)}
                >
                  <span className="matrix-step-index">{rowIdx + 1}</span>
                  <span className="matrix-step-name">{rowStep.name || '(未命名)'}</span>
                  {rowStep.isCritical && <span className="critical-marker">★</span>}
                </th>
                {steps.map((colStep) => {
                  const self = rowStep.id === colStep.id;
                  const checked = isDep(rowStep.id, colStep.id);
                  return (
                    <td
                      key={colStep.id}
                      className={`matrix-cell ${checked ? 'checked' : ''} ${self ? 'self' : ''}`}
                    >
                      {!self && (
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDependency(rowStep.id, colStep.id)}
                          title={
                            checked
                              ? `${rowStep.name || '(未命名)'} 依赖 ${colStep.name || '(未命名)'}`
                              : `设置 ${rowStep.name || '(未命名)'} 依赖 ${colStep.name || '(未命名)'}`
                          }
                        />
                      )}
                      {self && <span className="self-marker">—</span>}
                    </td>
                  );
                })}
                <td className="matrix-dep-count">
                  <strong>{rowStep.dependencies?.length || 0}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dependency-flow">
        <h4>流程流向（被依赖 → 后续步骤）</h4>
        {steps.every((s) => !s.dependencies || s.dependencies.length === 0) ? (
          <p className="hint">尚未配置任何依赖关系</p>
        ) : (
          <ul className="flow-list">
            {steps
              .filter((s) => s.dependencies && s.dependencies.length > 0)
              .map((s) => (
                <li key={s.id} className="flow-item">
                  <div className="flow-target">
                    <span className="flow-index">{getStepIndex(s.id)}</span>
                    <span>{s.name || '(未命名)'}</span>
                  </div>
                  <div className="flow-arrow">←</div>
                  <div className="flow-sources">
                    {s.dependencies.map((depId) => {
                      const dep = steps.find((x) => x.id === depId);
                      return (
                        <span key={depId} className="flow-source">
                          {dep ? (
                            <>
                              <span className="flow-index">{getStepIndex(depId)}</span>
                              {dep.name || '(未命名)'}
                            </>
                          ) : (
                            <span className="missing-dep">(已删除)</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
