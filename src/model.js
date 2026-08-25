// 数据模型：流程、步骤、草稿的工厂函数与常量

export const STEP_TYPES = [
  '准备',
  '试剂配制',
  '样本处理',
  '反应/孵育',
  '检测',
  '数据分析',
  '清洁收尾',
  '其他'
]

export const DURATION_UNITS = [
  { value: 'min', label: '分钟', factor: 1 },
  { value: 'h', label: '小时', factor: 60 },
  { value: 'day', label: '天', factor: 60 * 24 }
]

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function createStep(partial = {}) {
  return {
    id: uid('step'),
    name: partial.name || '新步骤',
    type: partial.type || '其他',
    durationMin: partial.durationMin ?? 30,
    inputMaterials: partial.inputMaterials ?? [],
    outputResults: partial.outputResults ?? [],
    notes: partial.notes ?? '',
    dependencies: partial.dependencies ?? [],
    isKey: partial.isKey ?? false
  }
}

export function createWorkflow(partial = {}) {
  const now = Date.now()
  return {
    id: uid('wf'),
    name: partial.name || '未命名流程',
    createdAt: now,
    updatedAt: now,
    steps: partial.steps ?? [],
    drafts: partial.drafts ?? []
  }
}

export function createDraft(workflow, draftName) {
  return {
    id: uid('draft'),
    name: draftName || `草稿 ${new Date().toLocaleString('zh-CN', { hour12: false })}`,
    savedAt: Date.now(),
    workflowName: workflow.name,
    steps: JSON.parse(JSON.stringify(workflow.steps))
  }
}

// 深拷贝步骤（复制步骤用），新 id、依赖保留（指向同流程内已存在的步骤）
export function cloneStep(step) {
  const copy = JSON.parse(JSON.stringify(step))
  copy.id = uid('step')
  copy.name = `${step.name} 副本`
  return copy
}

export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '未设置'
  if (minutes % (60 * 24) === 0) return `${minutes / (60 * 24)} 天`
  if (minutes % 60 === 0) return `${minutes / 60} 小时`
  return `${minutes} 分钟`
}

export function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// 首次打开时的示例流程
export function buildSeedState() {
  const wf = createWorkflow({ name: '示例：BCA 蛋白浓度测定' })
  const s1 = createStep({
    name: '试剂与器材准备',
    type: '准备',
    durationMin: 20,
    inputMaterials: ['BCA 试剂盒', '96 孔板', '移液器', '酶标仪'],
    outputResults: ['备好的试剂与器材'],
    notes: '检查试剂盒有效期，酶标仪提前 15 分钟开机预热。'
  })
  const s2 = createStep({
    name: '配制 BCA 工作液',
    type: '试剂配制',
    durationMin: 15,
    inputMaterials: ['BCA 试剂 A', 'BCA 试剂 B'],
    outputResults: ['BCA 工作液'],
    notes: 'A 液与 B 液按 50:1 混合，按需现配，24 小时内用完。',
    dependencies: [s1.id]
  })
  const s3 = createStep({
    name: '蛋白标准品稀释',
    type: '试剂配制',
    durationMin: 30,
    inputMaterials: ['BSA 标准品', 'PBS 缓冲液'],
    outputResults: ['梯度浓度标准品（0-2 mg/mL）'],
    notes: '梯度稀释时每管充分吹打混匀，更换枪头避免交叉污染。',
    dependencies: [s1.id]
  })
  const s4 = createStep({
    name: '加样与孵育',
    type: '反应/孵育',
    durationMin: 35,
    inputMaterials: ['待测蛋白样本', 'BCA 工作液', '梯度浓度标准品'],
    outputResults: ['显色反应后的 96 孔板'],
    notes: '关键步骤：每孔 200 μL 工作液 + 20 μL 样品，37°C 孵育 30 分钟，注意避光。',
    isKey: true,
    dependencies: [s2.id, s3.id]
  })
  const s5 = createStep({
    name: '酶标仪检测',
    type: '检测',
    durationMin: 15,
    inputMaterials: ['显色反应后的 96 孔板'],
    outputResults: ['562 nm 吸光度数据'],
    notes: '关键步骤：孵育结束后 10 分钟内完成读数，测定波长 562 nm。',
    isKey: true,
    dependencies: [s4.id]
  })
  const s6 = createStep({
    name: '标准曲线与浓度计算',
    type: '数据分析',
    durationMin: 20,
    inputMaterials: ['562 nm 吸光度数据'],
    outputResults: ['样本蛋白浓度结果表'],
    notes: 'R² 应 ≥ 0.99，否则需检查加样并重新测定。',
    dependencies: [s5.id]
  })
  wf.steps = [s1, s2, s3, s4, s5, s6]
  return {
    workflows: [wf],
    activeWorkflowId: wf.id,
    selectedStepId: s4.id
  }
}
