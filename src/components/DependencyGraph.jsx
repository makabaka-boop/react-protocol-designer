import React, { useMemo } from 'react'
import { useProtocol } from '../context/ProtocolContext.jsx'

// 依赖关系视图：按依赖深度自动分层的有向图（SVG 绘制）
// 箭头方向：依赖 → 当前步骤（表示先做依赖，再做当前步骤）

export default function DependencyGraph() {
  const { activeProtocol, state, selectStep } = useProtocol()

  const layout = useMemo(() => {
    if (!activeProtocol) return null
    const steps = activeProtocol.steps
    const idSet = new Set(steps.map((s) => s.id))
    const depsOf = new Map(
      steps.map((s) => [s.id, (s.dependencies || []).filter((d) => idSet.has(d))])
    )

    // 计算每个节点的层级（=最长依赖链长度）。带环时用访问标记兜底避免死循环。
    const depth = new Map()
    const visiting = new Set()
    const computeDepth = (id) => {
      if (depth.has(id)) return depth.get(id)
      if (visiting.has(id)) return 0 // 环：兜底
      visiting.add(id)
      const deps = depsOf.get(id) || []
      let d = 0
      deps.forEach((dep) => {
        d = Math.max(d, computeDepth(dep) + 1)
      })
      visiting.delete(id)
      depth.set(id, d)
      return d
    }
    steps.forEach((s) => computeDepth(s.id))

    // 按层分组
    const layers = new Map()
    steps.forEach((s) => {
      const d = depth.get(s.id) || 0
      if (!layers.has(d)) layers.set(d, [])
      layers.get(d).push(s)
    })

    const colGap = 190
    const rowGap = 92
    const nodeW = 150
    const nodeH = 54
    const padX = 30
    const padY = 30

    const pos = new Map()
    let maxRow = 0
    const sortedLayerKeys = [...layers.keys()].sort((a, b) => a - b)
    sortedLayerKeys.forEach((d) => {
      const arr = layers.get(d)
      arr.forEach((s, row) => {
        pos.set(s.id, {
          x: padX + d * colGap,
          y: padY + row * rowGap,
        })
        maxRow = Math.max(maxRow, row)
      })
    })

    const width = padX * 2 + (sortedLayerKeys.length || 1) * colGap
    const height = padY * 2 + (maxRow + 1) * rowGap

    const edges = []
    steps.forEach((s) => {
      ;(depsOf.get(s.id) || []).forEach((dep) => {
        edges.push({ from: dep, to: s.id })
      })
    })

    return { steps, pos, edges, width, height, nodeW, nodeH }
  }, [activeProtocol])

  if (!activeProtocol) return null

  return (
    <div className="dep-graph">
      <div className="panel-head"><h3>依赖关系视图</h3></div>
      {layout.steps.length === 0 ? (
        <p className="muted">没有步骤可展示。</p>
      ) : (
        <div className="graph-scroll">
          <svg
            width={layout.width}
            height={layout.height}
            className="graph-svg"
          >
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#7a8aa0" />
              </marker>
            </defs>

            {layout.edges.map((e, i) => {
              const a = layout.pos.get(e.from)
              const b = layout.pos.get(e.to)
              if (!a || !b) return null
              const x1 = a.x + layout.nodeW
              const y1 = a.y + layout.nodeH / 2
              const x2 = b.x
              const y2 = b.y + layout.nodeH / 2
              const mx = (x1 + x2) / 2
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  className="edge"
                  markerEnd="url(#arrow)"
                />
              )
            })}

            {layout.steps.map((s, idx) => {
              const p = layout.pos.get(s.id)
              const active = s.id === state.activeStepId
              return (
                <g
                  key={s.id}
                  transform={`translate(${p.x}, ${p.y})`}
                  className={`node ${active ? 'active' : ''} ${s.isKey ? 'key' : ''}`}
                  onClick={() => selectStep(s.id)}
                >
                  <rect width={layout.nodeW} height={layout.nodeH} rx="8" />
                  <text x="10" y="22" className="node-title">
                    {(idx + 1) + '. ' + (s.name || '未命名').slice(0, 10)}
                  </text>
                  <text x="10" y="40" className="node-sub">
                    {s.isKey ? '★ 关键 · ' : ''}依赖 {s.dependencies?.length || 0}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}
      <div className="graph-legend">
        <span><i className="dot" /> 普通步骤</span>
        <span><i className="dot key" /> 关键步骤</span>
        <span>箭头：依赖 → 当前步骤</span>
      </div>
    </div>
  )
}
