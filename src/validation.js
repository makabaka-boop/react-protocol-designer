// 流程校验：循环依赖、悬空依赖、步骤字段完整性检查
// 问题级别：error（错误，阻断“校验通过”）/ warning（警告，不阻断）

// 在依赖图中查找所有环。
// 边的方向：依赖(前置) -> 被依赖(后续)，即 dep -> step
export function findCycles(steps) {
  const byId = new Map(steps.map((s) => [s.id, s]))
  const adj = new Map()
  for (const s of steps) {
    for (const depId of s.dependencies) {
      if (!adj.has(depId)) adj.set(depId, [])
      adj.get(depId).push(s.id)
    }
  }

  const WHITE = 0
  const GRAY = 1
  const BLACK = 2
  const color = new Map(steps.map((s) => [s.id, WHITE]))
  const cycles = []
  const seenKeys = new Set()

  const dfs = (u, stack) => {
    color.set(u, GRAY)
    stack.push(u)
    for (const v of adj.get(u) || []) {
      if (!byId.has(v)) continue
      if (color.get(v) === GRAY) {
        const start = stack.indexOf(v)
        const cycle = stack.slice(start).concat(v)
        const key = [...cycle].sort().join('|')
        if (!seenKeys.has(key)) {
          seenKeys.add(key)
          cycles.push(cycle)
        }
      } else if (color.get(v) === WHITE) {
        dfs(v, stack)
      }
    }
    stack.pop()
    color.set(u, BLACK)
  }

  for (const s of steps) {
    if (color.get(s.id) === WHITE) dfs(s.id, [])
  }
  return cycles
}

// 判断：让 stepId 新增依赖 newDepId 是否会形成环
// 成环条件：newDepId 已经（传递地）依赖 stepId
export function wouldCreateCycle(steps, stepId, newDepId) {
  const byId = new Map(steps.map((s) => [s.id, s]))
  const visited = new Set([newDepId])
  const stack = [newDepId]
  while (stack.length) {
    const cur = stack.pop()
    const step = byId.get(cur)
    if (!step) continue
    for (const depId of step.dependencies) {
      if (depId === stepId) return true
      if (!visited.has(depId)) {
        visited.add(depId)
        stack.push(depId)
      }
    }
  }
  return false
}

export function validateWorkflow(workflow) {
  const issues = []
  const steps = workflow?.steps ?? []
  const byId = new Map(steps.map((s) => [s.id, s]))
  const nameOf = (id) => (byId.get(id)?.name || '未知步骤')

  // 1. 循环依赖（错误）
  const cycles = findCycles(steps)
  for (const cycle of cycles) {
    issues.push({
      id: `cycle-${cycle.join('-')}`,
      severity: 'error',
      type: 'cycle',
      stepId: cycle[0],
      message: `循环依赖：${cycle.map(nameOf).join(' → ')}，依赖关系不能形成环`
    })
  }

  // 2. 依赖了已不存在的步骤（错误）
  for (const step of steps) {
    const dangling = step.dependencies.filter((depId) => !byId.has(depId))
    if (dangling.length > 0) {
      issues.push({
        id: `dangling-${step.id}`,
        severity: 'error',
        type: 'dangling',
        stepId: step.id,
        message: `「${step.name}」依赖的步骤已不存在（可能已被删除），请重新配置依赖`
      })
    }
  }

  // 3. 单步骤字段检查
  for (const step of steps) {
    const materials = (step.inputMaterials || []).map((m) => m.trim()).filter(Boolean)
    const outputs = (step.outputResults || []).map((o) => o.trim()).filter(Boolean)

    if (!step.name || !step.name.trim()) {
      issues.push({
        id: `name-${step.id}`,
        severity: 'error',
        type: 'empty-name',
        stepId: step.id,
        message: '步骤名不能为空'
      })
    }

    if (step.isKey && !(step.notes || '').trim()) {
      issues.push({
        id: `keynotes-${step.id}`,
        severity: 'error',
        type: 'key-no-notes',
        stepId: step.id,
        message: `「${step.name}」是关键步骤，必须填写注意事项`
      })
    }

    if (materials.length === 0) {
      issues.push({
        id: `input-${step.id}`,
        severity: 'warning',
        type: 'no-input',
        stepId: step.id,
        message: `「${step.name}」缺少输入材料`
      })
    }

    if (outputs.length === 0) {
      issues.push({
        id: `output-${step.id}`,
        severity: 'warning',
        type: 'no-output',
        stepId: step.id,
        message: `「${step.name}」没有输出结果`
      })
    }

    if (!(Number(step.durationMin) > 0)) {
      issues.push({
        id: `duration-${step.id}`,
        severity: 'warning',
        type: 'bad-duration',
        stepId: step.id,
        message: `「${step.name}」的预计耗时未填写或无效`
      })
    }
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length
  return { issues, errorCount, warningCount, cycles }
}
