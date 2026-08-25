import { useMemo } from 'react'
import { formatDuration } from '../model.js'

const NODE_W = 168
const NODE_H = 56
const COL_GAP = 56
const ROW_GAP = 28
const PAD = 24

// 按依赖深度分层：无依赖的步骤在第 0 列，其余每深一层右移一列
function computeLayout(steps) {
  const byId = new Map(steps.map((s) => [s.id, s]))
  const cache = new Map()
  const computing = new Set()

  const levelOf = (id) => {
    if (cache.has(id)) return cache.get(id)
    if (computing.has(id)) return 0 // 环保护：避免无限递归
    computing.add(id)
    const step = byId.get(id)
    let lvl = 0
    if (step) {
      for (const depId of step.dependencies) {
        if (byId.has(depId)) lvl = Math.max(lvl, levelOf(depId) + 1)
      }
    }
    computing.delete(id)
    cache.set(id, lvl)
    return lvl
  }

  const columns = new Map()
  for (const s of steps) {
    const lvl = levelOf(s.id)
    if (!columns.has(lvl)) columns.set(lvl, [])
    columns.get(lvl).push(s)
  }

  const positions = new Map()
  let maxLevel = 0
  let maxRows = 0
  for (const [lvl, list] of columns) {
    maxLevel = Math.max(maxLevel, lvl)
    maxRows = Math.max(maxRows, list.length)
    list.forEach((s, i) => {
      positions.set(s.id, {
        x: PAD + lvl * (NODE_W + COL_GAP),
        y: PAD + i * (NODE_H + ROW_GAP)
      })
    })
  }

  const width = PAD * 2 + (maxLevel + 1) * NODE_W + maxLevel * COL_GAP
  const height = PAD * 2 + Math.max(maxRows, 1) * NODE_H + Math.max(maxRows - 1, 0) * ROW_GAP
  return { positions, width, height }
}

function truncate(name, max = 11) {
  if (!name) return '未命名步骤'
  return name.length > max ? name.slice(0, max) + '…' : name
}

export default function DependencyGraph({ steps, selectedId, issuesByStep, cycles, onSelect }) {
  const { positions, width, height } = useMemo(() => computeLayout(steps), [steps])

  const cycleEdges = useMemo(() => {
    const set = new Set()
    for (const cycle of cycles) {
      for (let i = 0; i < cycle.length - 1; i++) {
        set.add(`${cycle[i]}->${cycle[i + 1]}`)
      }
    }
    return set
  }, [cycles])

  if (steps.length === 0) {
    return (
      <div className="dependency-panel">
        <div className="panel-header">
          <h3>依赖关系视图</h3>
        </div>
        <div className="empty-hint">新增步骤后，这里会展示步骤间的依赖关系图</div>
      </div>
    )
  }

  const edges = []
  for (const step of steps) {
    const to = positions.get(step.id)
    for (const depId of step.dependencies) {
      const from = positions.get(depId)
      if (!from || !to) continue
      const inCycle = cycleEdges.has(`${depId}->${step.id}`)
      const x1 = from.x + NODE_W
      const y1 = from.y + NODE_H / 2
      const x2 = to.x
      const y2 = to.y + NODE_H / 2
      let d
      if (from.x === to.x) {
        d = `M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 + 40} ${y2}, ${x2} ${y2}`
      } else {
        const dx = Math.max(40, Math.abs(x2 - x1) / 2)
        d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
      }
      edges.push({ key: `${depId}-${step.id}`, d, inCycle })
    }
  }

  return (
    <div className="dependency-panel">
      <div className="panel-header">
        <h3>依赖关系视图</h3>
        <span className="panel-subtitle">前置步骤 → 后续步骤</span>
      </div>
      <div className="graph-scroll">
        <svg width={width} height={height} className="dependency-svg">
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3"
              orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="#8a94a6" />
            </marker>
            <marker id="arrow-red" markerWidth="10" markerHeight="10" refX="8" refY="3"
              orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="#e5484d" />
            </marker>
          </defs>

          {edges.map((e) => (
            <path
              key={e.key}
              d={e.d}
              className={`graph-edge ${e.inCycle ? 'edge-cycle' : ''}`}
              markerEnd={e.inCycle ? 'url(#arrow-red)' : 'url(#arrow)'}
              fill="none"
            />
          ))}

          {steps.map((step) => {
            const pos = positions.get(step.id)
            const issues = issuesByStep.get(step.id) || []
            const hasError = issues.some((i) => i.severity === 'error')
            const hasWarning = !hasError && issues.some((i) => i.severity === 'warning')
            const cls = [
              'graph-node',
              selectedId === step.id ? 'node-selected' : '',
              hasError ? 'node-error' : '',
              hasWarning ? 'node-warning' : '',
              step.isKey ? 'node-key' : ''
            ].join(' ')
            return (
              <g
                key={step.id}
                className={cls}
                transform={`translate(${pos.x},${pos.y})`}
                onClick={() => onSelect(step.id)}
              >
                <rect width={NODE_W} height={NODE_H} rx="8" ry="8" />
                <text x="12" y="23" className="node-text node-name">
                  {step.isKey ? '★ ' : ''}{truncate(step.name)}
                </text>
                <text x="12" y="42" className="node-text node-meta">
                  {step.type} · {formatDuration(step.durationMin)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="graph-legend">
        <span><i className="legend-box legend-key" />关键步骤</span>
        <span><i className="legend-box legend-error" />有错误</span>
        <span><i className="legend-box legend-warning" />有警告</span>
        <span>点击节点可选中步骤</span>
      </div>
    </div>
  )
}
