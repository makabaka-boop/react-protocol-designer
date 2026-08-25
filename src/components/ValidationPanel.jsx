export default function ValidationPanel({ validation, onSelectStep }) {
  const { issues, errorCount, warningCount } = validation

  if (issues.length === 0) {
    return (
      <div className="validation-panel">
        <div className="panel-header">
          <h3>校验结果</h3>
          <span className="badge badge-ok">校验通过</span>
        </div>
        <div className="validation-ok">
          <div className="validation-ok-icon">✓</div>
          <div>未发现问题，流程可以保存使用</div>
        </div>
      </div>
    )
  }

  return (
    <div className="validation-panel">
      <div className="panel-header">
        <h3>校验结果</h3>
        <span className="badge badge-error">{errorCount} 错误</span>
        <span className="badge badge-warning">{warningCount} 警告</span>
      </div>
      <ul className="issue-list">
        {issues.map((issue) => (
          <li
            key={issue.id}
            className={`issue-item issue-${issue.severity} ${issue.stepId ? 'clickable' : ''}`}
            onClick={() => issue.stepId && onSelectStep(issue.stepId)}
            title={issue.stepId ? '点击定位到该步骤' : undefined}
          >
            <span className="issue-icon">{issue.severity === 'error' ? '✕' : '⚠'}</span>
            <span className="issue-message">{issue.message}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
