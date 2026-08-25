// 数据模型与工厂函数
export const STEP_TYPES = ['反应', '加热', '冷却', '混合', '过滤', '洗涤', '干燥', '检测', '其他']

export function createStep(partial = {}) {
  return {
    id: crypto.randomUUID(),
    name: '',
    type: '反应',
    duration: 30, // 分钟
    inputs: [], // 输入材料
    outputs: [], // 输出结果
    notes: '', // 注意事项
    critical: false, // 是否关键步骤
    deps: [], // 依赖步骤 id 列表
    ...partial,
  }
}

export function createFlow(partial = {}) {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name: '未命名流程',
    createdAt: now,
    updatedAt: now,
    steps: [],
    ...partial,
  }
}
