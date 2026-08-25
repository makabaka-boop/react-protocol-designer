import React, { useState } from 'react'

// 字符串列表编辑器（用于输入材料、输出结果）
// 通过在父级用 key 强制重挂载，避免切换步骤时输入残留
export default function StringListEditor({ label, items, placeholder, onChange }) {
  const [draft, setDraft] = useState('')

  // 容忍脏数据：非数组归一为空数组，非字符串项转成字符串，避免渲染/编辑时报错
  const safeItems = Array.isArray(items)
    ? items.map((x) => (typeof x === 'string' ? x : x == null ? '' : String(x)))
    : []

  const add = () => {
    const v = draft.trim()
    if (!v) return
    onChange([...safeItems, v])
    setDraft('')
  }
  const remove = (idx) => {
    const next = [...safeItems]
    next.splice(idx, 1)
    onChange(next)
  }
  const edit = (idx, v) => {
    const next = [...safeItems]
    next[idx] = v
    onChange(next)
  }

  return (
    <div className="list-editor">
      <span className="field-label">{label}</span>
      <ul className="chip-list">
        {safeItems.map((it, idx) => (
          <li key={idx} className="chip">
            <input
              className="chip-input"
              value={it}
              onChange={(e) => edit(idx, e.target.value)}
            />
            <button className="chip-del" title="删除" onClick={() => remove(idx)}>×</button>
          </li>
        ))}
      </ul>
      <div className="list-add">
        <input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <button className="btn" onClick={add}>添加</button>
      </div>
    </div>
  )
}
