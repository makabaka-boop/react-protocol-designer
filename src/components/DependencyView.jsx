import { useMemo } from 'react'
import { computeLevels } from '../lib/validate.js'

const BOX_W = 150
const BOX_H = 46
const COL_GAP = 200
const ROW_GAP = 64
const PAD = 24

// 依赖关系视图：按拓扑层级排布节点，SVG 连线表示依赖
export default function DependencyView({ flow, selectedStepId, onSelectStep, cycleStepIds }) {
  const { nodes, edges, width, height } = useMemo(() => {
    const steps = flow.steps
    const levels = computeLevels(steps)
    // 每层内部按 steps 原始顺序排列
    const perLevel = new Map()
    for (const s of steps) {
      const lv = levels.get(s.id)
      if (!perLevel.has(lv)) perLevel.set(lv, [])
      perLevel.get(lv).push(s.id)
    }
    const pos = new Map()
    for (const [lv, ids] of perLevel) {
      ids.forEach((id, i) => {
        pos.set(id, { x: PAD + lv * COL_GAP, y: PAD + i * ROW_GAP })
      })
    }
    const edges = []
    for (const s of steps) {
      for (const d of s.deps) {
        if (pos.has(d)) edges.push({ from: d, to: s.id })
      }
    }
    const maxLv = Math.max(0, ...perLevel.keys())
    const maxRows = Math.max(1, ...[...perLevel.values()].map((v) => v.length))
    return {
      nodes: steps.map((s) => ({ step: s, ...pos.get(s.id) })),
      edges,
      width: PAD * 2 + maxLv * COL_GAP + BOX_W,
      height: PAD * 2 + (maxRows - 1) * ROW_GAP + BOX_H,
    }
  }, [flow.steps])

  const posOf = (id) => nodes.find((n) => n.step.id === id)

  return (
    <div className="panel dep-view">
      <div className="panel-header"><h3>依赖关系视图</h3></div>
      {flow.steps.length === 0 ? (
        <p className="empty">添加步骤后这里会显示依赖关系图。</p>
      ) : (
        <div className="dep-canvas">
          <svg width={width} height={height}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
              </marker>
            </defs>
            {edges.map((e, i) => {
              const a = posOf(e.from)
              const b = posOf(e.to)
              const x1 = a.x + BOX_W
              const y1 = a.y + BOX_H / 2
              const x2 = b.x
              const y2 = b.y + BOX_H / 2
              const midX = (x1 + x2) / 2
              const inCycle = cycleStepIds.has(e.from) && cycleStepIds.has(e.to)
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={inCycle ? '#dc2626' : '#94a3b8'}
                  strokeWidth={inCycle ? 2 : 1.5}
                  strokeDasharray={inCycle ? '5 4' : undefined}
                  markerEnd="url(#arrow)"
                />
              )
            })}
            {nodes.map(({ step, x, y }) => (
              <g
                key={step.id}
                transform={`translate(${x}, ${y})`}
                className={`dep-node ${step.id === selectedStepId ? 'active' : ''} ${step.critical ? 'critical' : ''} ${cycleStepIds.has(step.id) ? 'in-cycle' : ''}`}
                onClick={() => onSelectStep(step.id)}
              >
                <rect width={BOX_W} height={BOX_H} rx={8} />
                <text x={BOX_W / 2} y={19} textAnchor="middle" className="dep-node-name">
                  {(step.name || '(未命名)').slice(0, 9)}
                </text>
                <text x={BOX_W / 2} y={36} textAnchor="middle" className="dep-node-meta">
                  {step.type} · {step.duration}min{step.critical ? ' · 关键' : ''}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  )
}
