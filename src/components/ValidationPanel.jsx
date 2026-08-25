// 校验结果面板
export default function ValidationPanel({ issues, onLocateStep }) {
  const errors = issues.filter((i) => i.level === 'error')
  const warnings = issues.filter((i) => i.level === 'warning')
  return (
    <div className="panel validation-panel">
      <div className="panel-header">
        <h3>校验结果</h3>
        <span className="validation-summary">
          {issues.length === 0
            ? '✓ 未发现问题'
            : `${errors.length} 个错误 · ${warnings.length} 个警告`}
        </span>
      </div>
      {issues.length === 0 ? (
        <p className="empty ok">当前流程通过了全部校验规则。</p>
      ) : (
        <ul className="issue-list">
          {issues.map((issue, i) => (
            <li
              key={i}
              className={`issue ${issue.level}`}
              onClick={() => issue.stepIds?.length && onLocateStep(issue.stepIds[0])}
              title={issue.stepIds?.length ? '点击定位到相关步骤' : undefined}
            >
              <span className="issue-level">{issue.level === 'error' ? '错误' : '警告'}</span>
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
