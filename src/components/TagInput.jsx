import { useState } from 'react'

// 标签式输入：用于输入材料 / 输出结果（字符串数组）
export default function TagInput({ items = [], onChange, placeholder, addText = '添加' }) {
  const [value, setValue] = useState('')

  const add = () => {
    const v = value.trim()
    if (!v) return
    onChange([...items, v])
    setValue('')
  }

  const remove = (idx) => {
    onChange(items.filter((_, i) => i !== idx))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && value === '' && items.length > 0) {
      remove(items.length - 1)
    }
  }

  return (
    <div className="tag-input">
      <div className="tag-list">
        {items.map((item, idx) => (
          <span className="tag" key={`${item}-${idx}`}>
            {item}
            <button
              type="button"
              className="tag-remove"
              onClick={() => remove(idx)}
              title="删除"
            >
              ×
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="tag-placeholder">暂无内容</span>}
      </div>
      <div className="tag-add-row">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="btn btn-sm" onClick={add}>
          {addText}
        </button>
      </div>
    </div>
  )
}
