import { useState } from 'react'

// 标签输入：回车或逗号添加，支持一次输入/粘贴多个逗号分隔的值，点击标签删除
export default function TagInput({ value, onChange, placeholder }) {
  const [text, setText] = useState('')

  const mergeTags = (tags) => {
    const merged = [...value]
    for (const t of tags) if (t && !merged.includes(t)) merged.push(t)
    if (merged.length !== value.length) onChange(merged)
  }

  // 失焦/回车：把剩余文本按逗号拆分后全部提交
  const commit = () => {
    mergeTags(text.split(/[,，]/).map((t) => t.trim()).filter(Boolean))
    setText('')
  }

  return (
    <div className="tag-input">
      {value.map((tag) => (
        <span key={tag} className="tag" title="点击删除" onClick={() => onChange(value.filter((t) => t !== tag))}>
          {tag} ×
        </span>
      ))}
      <input
        value={text}
        placeholder={value.length ? '' : placeholder}
        onChange={(e) => {
          const v = e.target.value
          if (/[,，]/.test(v)) {
            // 输入过程中遇到逗号：拆出逗号前的完整部分立即提交，最后一段留在输入框继续编辑
            const parts = v.split(/[,，]/)
            mergeTags(parts.slice(0, -1).map((t) => t.trim()).filter(Boolean))
            setText(parts[parts.length - 1])
          } else {
            setText(v)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Backspace' && !text && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={commit}
      />
    </div>
  )
}
