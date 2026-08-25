import React from 'react'
import { useProtocol } from '../context/ProtocolContext.jsx'
import { validateProtocol } from '../lib/validation.js'

export default function ValidationPanel() {
  const { activeProtocol, selectStep } = useProtocol()
  if (!activeProtocol) return null

  const { errors, warnings, ok } = validateProtocol(activeProtocol)

  return (
    <div className="validation">
      <div className="panel-head">
        <h3>校验结果</h3>
        <span className={`status-pill ${ok ? 'ok' : 'bad'}`}>
          {ok ? '✓ 通过' : `${errors.length} 错误`}
          {warnings.length > 0 && ` · ${warnings.length} 警告`}
        </span>
      </div>

      {errors.length === 0 && warnings.length === 0 ? (
        <p className="all-good">🎉 未发现问题，流程校验通过。</p>
      ) : (
        <div className="issue-groups">
          {errors.length > 0 && (
            <div className="issue-group">
              <h4 className="group-title error">⛔ 错误（{errors.length}）</h4>
              <ul>
                {errors.map((e, i) => (
                  <li
                    key={`e${i}`}
                    className="issue-row error"
                    onClick={() => e.stepIds?.[0] && selectStep(e.stepIds[0])}
                  >
                    {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="issue-group">
              <h4 className="group-title warn">⚠️ 警告（{warnings.length}）</h4>
              <ul>
                {warnings.map((w, i) => (
                  <li
                    key={`w${i}`}
                    className="issue-row warn"
                    onClick={() => w.stepIds?.[0] && selectStep(w.stepIds[0])}
                  >
                    {w.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="rules-hint">
        <h4>校验规则</h4>
        <ul>
          <li>🔴 循环依赖</li>
          <li>🔴 步骤名为空</li>
          <li>🔴 关键步骤缺少注意事项</li>
          <li>🔴 依赖无效 / 依赖自身</li>
          <li>🟡 缺少输入材料</li>
          <li>🟡 没有输出结果</li>
        </ul>
      </div>
    </div>
  )
}
