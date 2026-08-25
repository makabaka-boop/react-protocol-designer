// 流程校验：循环依赖、缺少输入材料、没有输出结果、关键步骤缺少注意事项等
export function validateFlow(flow) {
  const issues = []
  const steps = flow.steps
  const byId = new Map(steps.map((s) => [s.id, s]))
  const label = (s) => (s.name?.trim() ? `「${s.name.trim()}」` : '(未命名步骤)')

  // 1. 循环依赖检测（DFS 三色标记）
  const color = new Map() // 0 未访问 1 访问中 2 已完成
  const stack = []
  const cycles = []
  const dfs = (id) => {
    color.set(id, 1)
    stack.push(id)
    for (const depId of byId.get(id)?.deps ?? []) {
      if (!byId.has(depId)) continue
      if (color.get(depId) === 1) {
        const start = stack.indexOf(depId)
        cycles.push([...stack.slice(start), depId])
      } else if (!color.get(depId)) {
        dfs(depId)
      }
    }
    stack.pop()
    color.set(id, 2)
  }
  for (const s of steps) if (!color.get(s.id)) dfs(s.id)
  for (const cycle of cycles) {
    issues.push({
      level: 'error',
      type: 'cycle',
      stepIds: cycle,
      message: `循环依赖：${cycle.map((id) => label(byId.get(id))).join(' → ')}`,
    })
  }

  for (const step of steps) {
    // 2. 步骤名为空
    if (!step.name?.trim()) {
      issues.push({ level: 'error', type: 'no-name', stepIds: [step.id], message: '存在未命名步骤' })
    }
    // 3. 依赖了不存在的步骤
    for (const depId of step.deps) {
      if (!byId.has(depId)) {
        issues.push({
          level: 'error',
          type: 'dangling-dep',
          stepIds: [step.id],
          message: `步骤 ${label(step)} 依赖了一个已被删除的步骤`,
        })
      }
    }
    // 4. 缺少输入材料
    if (step.inputs.length === 0) {
      issues.push({
        level: 'warning',
        type: 'no-input',
        stepIds: [step.id],
        message: `步骤 ${label(step)} 缺少输入材料`,
      })
    } else {
      // 5. 输入材料未被任何上游依赖步骤产出
      const upstreamOutputs = new Set()
      const collect = (id, seen = new Set()) => {
        if (seen.has(id) || !byId.has(id)) return
        seen.add(id)
        const s = byId.get(id)
        s.outputs.forEach((o) => upstreamOutputs.add(o.trim()))
        s.deps.forEach((d) => collect(d, seen))
      }
      step.deps.forEach((d) => collect(d))
      if (step.deps.length > 0) {
        for (const input of step.inputs) {
          if (!upstreamOutputs.has(input.trim())) {
            issues.push({
              level: 'warning',
              type: 'input-not-produced',
              stepIds: [step.id],
              message: `步骤 ${label(step)} 的输入「${input}」未由任何上游依赖步骤产出`,
            })
          }
        }
      }
    }
    // 6. 没有输出结果
    if (step.outputs.length === 0) {
      issues.push({
        level: 'warning',
        type: 'no-output',
        stepIds: [step.id],
        message: `步骤 ${label(step)} 没有输出结果`,
      })
    }
    // 7. 关键步骤缺少注意事项
    if (step.critical && !step.notes?.trim()) {
      issues.push({
        level: 'error',
        type: 'critical-no-notes',
        stepIds: [step.id],
        message: `关键步骤 ${label(step)} 缺少注意事项`,
      })
    }
    // 8. 预计耗时不合法
    if (!(Number(step.duration) > 0)) {
      issues.push({
        level: 'warning',
        type: 'bad-duration',
        stepIds: [step.id],
        message: `步骤 ${label(step)} 的预计耗时应大于 0 分钟`,
      })
    }
  }
  return issues
}

// 拓扑分层，供依赖关系视图布局使用；环中的节点追加在最后
export function computeLevels(steps) {
  const byId = new Map(steps.map((s) => [s.id, s]))
  const indeg = new Map(steps.map((s) => [s.id, 0]))
  const children = new Map(steps.map((s) => [s.id, []]))
  for (const s of steps) {
    for (const d of s.deps) {
      if (!byId.has(d)) continue
      indeg.set(s.id, indeg.get(s.id) + 1)
      children.get(d).push(s.id)
    }
  }
  const level = new Map()
  let frontier = steps.filter((s) => indeg.get(s.id) === 0).map((s) => s.id)
  let depth = 0
  const visited = new Set()
  while (frontier.length) {
    const next = []
    for (const id of frontier) {
      if (visited.has(id)) continue
      visited.add(id)
      level.set(id, depth)
      for (const c of children.get(id)) {
        indeg.set(c, indeg.get(c) - 1)
        if (indeg.get(c) === 0) next.push(c)
      }
    }
    frontier = next
    depth += 1
  }
  // 环中或不可达的节点放到最后一层之后
  for (const s of steps) if (!level.has(s.id)) level.set(s.id, depth)
  return level
}
