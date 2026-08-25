// 流程校验：循环依赖检测 + 规则集
// 返回结构：{ errors: [], warnings: [], stepIssues: { [stepId]: {errors:[],warnings:[]} } }

// 把任意值安全地归一为「非空字符串数组」，容忍脏数据（null、数字、对象、非数组等）
function toCleanStringList(value) {
  if (!Array.isArray(value)) return []
  return value
    .filter((x) => typeof x === 'string')
    .map((x) => x.trim())
    .filter((x) => x.length > 0)
}

// 使用 Tarjan 强连通分量算法检测循环依赖。
// 强连通分量中节点数 > 1，或节点存在自环，即构成循环依赖。
function findCircularDependencies(steps) {
  const idSet = new Set(steps.map((s) => s.id))
  // 邻接表：step -> 其依赖的步骤（只保留仍存在的依赖）
  const adj = new Map()
  steps.forEach((s) => {
    adj.set(
      s.id,
      (s.dependencies || []).filter((d) => idSet.has(d))
    )
  })

  let index = 0
  const indices = new Map()
  const lowlink = new Map()
  const onStack = new Map()
  const stack = []
  const sccs = []

  function strongconnect(v) {
    indices.set(v, index)
    lowlink.set(v, index)
    index += 1
    stack.push(v)
    onStack.set(v, true)

    for (const w of adj.get(v) || []) {
      if (!indices.has(w)) {
        strongconnect(w)
        lowlink.set(v, Math.min(lowlink.get(v), lowlink.get(w)))
      } else if (onStack.get(w)) {
        lowlink.set(v, Math.min(lowlink.get(v), indices.get(w)))
      }
    }

    if (lowlink.get(v) === indices.get(v)) {
      const comp = []
      let w
      do {
        w = stack.pop()
        onStack.set(w, false)
        comp.push(w)
      } while (w !== v)
      sccs.push(comp)
    }
  }

  steps.forEach((s) => {
    if (!indices.has(s.id)) strongconnect(s.id)
  })

  // 收集处于环中的步骤 id
  const cyclicIds = new Set()
  sccs.forEach((comp) => {
    if (comp.length > 1) {
      comp.forEach((id) => cyclicIds.add(id))
    } else {
      const id = comp[0]
      // 自环
      if ((adj.get(id) || []).includes(id)) cyclicIds.add(id)
    }
  })

  return { cyclicIds, sccs: sccs.filter((c) => c.length > 1) }
}

// 主校验函数
export function validateProtocol(protocol) {
  const errors = []
  const warnings = []
  const stepIssues = {}

  const push = (stepId, level, message) => {
    if (!stepIssues[stepId]) stepIssues[stepId] = { errors: [], warnings: [] }
    stepIssues[stepId][level === 'error' ? 'errors' : 'warnings'].push(message)
  }

  if (!protocol) {
    return { errors: [{ message: '未选择流程' }], warnings: [], stepIssues }
  }

  const steps = protocol.steps || []
  const nameMap = new Map(steps.map((s) => [s.id, s.name || '(未命名步骤)']))

  if (steps.length === 0) {
    warnings.push({ message: '流程中还没有任何步骤' })
  }

  // 规则 1：循环依赖（错误）
  const { cyclicIds, sccs } = findCircularDependencies(steps)
  if (cyclicIds.size > 0) {
    sccs.forEach((comp) => {
      const names = comp.map((id) => nameMap.get(id) || id).join(' → ')
      errors.push({ message: `检测到循环依赖：${names}`, stepIds: comp })
    })
    cyclicIds.forEach((id) => push(id, 'error', '该步骤处于循环依赖中'))
  }

  // 逐步骤规则
  steps.forEach((s) => {
    const label = s.name || '(未命名步骤)'

    // 规则 2：步骤名为空（错误）
    if (!s.name || !s.name.trim()) {
      errors.push({ message: '存在未命名的步骤', stepIds: [s.id] })
      push(s.id, 'error', '步骤名不能为空')
    }

    // 规则 3：缺少输入材料（警告）
    if (toCleanStringList(s.inputs).length === 0) {
      warnings.push({ message: `步骤「${label}」缺少输入材料`, stepIds: [s.id] })
      push(s.id, 'warning', '缺少输入材料')
    }

    // 规则 4：没有输出结果（警告）
    if (toCleanStringList(s.outputs).length === 0) {
      warnings.push({ message: `步骤「${label}」没有输出结果`, stepIds: [s.id] })
      push(s.id, 'warning', '没有输出结果')
    }

    // 规则 5：关键步骤缺少注意事项（错误）
    if (s.isKey && (!s.notes || !s.notes.trim())) {
      errors.push({ message: `关键步骤「${label}」缺少注意事项`, stepIds: [s.id] })
      push(s.id, 'error', '关键步骤必须填写注意事项')
    }

    // 规则 6：依赖指向不存在的步骤（错误）
    const idSet = new Set(steps.map((x) => x.id))
    ;(s.dependencies || []).forEach((d) => {
      if (!idSet.has(d)) {
        errors.push({ message: `步骤「${label}」依赖了不存在的步骤`, stepIds: [s.id] })
        push(s.id, 'error', '存在无效的依赖引用')
      }
    })

    // 规则 6 附加：依赖自身（错误）
    if ((s.dependencies || []).includes(s.id)) {
      errors.push({ message: `步骤「${label}」不能依赖自身`, stepIds: [s.id] })
      push(s.id, 'error', '不能依赖自身')
    }
  })

  return { errors, warnings, stepIssues, ok: errors.length === 0 }
}
