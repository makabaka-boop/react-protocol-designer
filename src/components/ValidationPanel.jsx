import { useProtocol } from '../context/ProtocolContext';
import { SEVERITY } from '../validation';

const ISSUE_LABELS = {
  circular_dependency: '循环依赖',
  missing_input: '缺少输入材料',
  missing_output: '缺少输出结果',
  critical_no_notes: '关键步骤缺注意事项',
  dangling_dependency: '悬空依赖',
  empty_name: '步骤名为空',
};

export default function ValidationPanel() {
  const { validation, setSelectedStepId, currentProtocol } = useProtocol();

  const { issues, errorCount, warningCount, isValid } = validation;

  const handleClick = (issue) => {
    if (issue.stepId && currentProtocol) {
      setSelectedStepId(issue.stepId);
    }
  };

  return (
    <div className="validation-panel">
      <div className="validation-header">
        <h3>校验结果</h3>
        <div className="validation-summary">
          {isValid ? (
            <span className="badge badge-success">✓ 通过</span>
          ) : (
            <span className="badge badge-error">✕ 未通过</span>
          )}
          {errorCount > 0 && <span className="badge badge-error">{errorCount} 错误</span>}
          {warningCount > 0 && <span className="badge badge-warning">{warningCount} 警告</span>}
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="validation-empty">
          <p>🎉 未发现问题，流程配置完整！</p>
        </div>
      ) : (
        <ul className="issue-list">
          {issues.map((issue) => (
            <li
              key={issue.id}
              className={`issue-item issue-${issue.severity}`}
              onClick={() => handleClick(issue)}
              style={{ cursor: issue.stepId ? 'pointer' : 'default' }}
            >
              <div className="issue-icon">
                {issue.severity === SEVERITY.ERROR ? '●' : '◐'}
              </div>
              <div className="issue-content">
                <div className="issue-type">
                  <span className={`issue-tag tag-${issue.severity}`}>
                    {ISSUE_LABELS[issue.type] || issue.type}
                  </span>
                  {issue.stepName && (
                    <span className="issue-step">步骤：{issue.stepName}</span>
                  )}
                </div>
                <div className="issue-message">{issue.message}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="validation-rules-info">
        <details>
          <summary>校验规则说明</summary>
          <ul>
            <li><strong>循环依赖</strong>（错误）：步骤之间的依赖形成闭环，无法确定执行顺序</li>
            <li><strong>缺少输出结果</strong>（错误）：每个步骤都应定义产出结果</li>
            <li><strong>关键步骤缺注意事项</strong>（错误）：标记为关键的步骤必须填写注意事项</li>
            <li><strong>悬空依赖</strong>（警告）：依赖指向了已被删除的步骤</li>
            <li><strong>缺少输入材料</strong>（警告）：步骤未填写任何输入材料</li>
            <li><strong>步骤名为空</strong>（警告）：建议为每个步骤命名以便识别</li>
          </ul>
        </details>
      </div>
    </div>
  );
}
