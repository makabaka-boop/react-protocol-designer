// 数据模型定义与工厂函数
// 所有数据均为纯前端结构，序列化后保存在 localStorage

// 步骤类型枚举
export const STEP_TYPES = [
  { value: 'prepare', label: '准备' },
  { value: 'reaction', label: '反应' },
  { value: 'separation', label: '分离' },
  { value: 'measurement', label: '测量' },
  { value: 'analysis', label: '分析' },
  { value: 'cleanup', label: '清理' },
  { value: 'other', label: '其他' },
]

// 耗时单位
export const DURATION_UNITS = [
  { value: 'min', label: '分钟' },
  { value: 'hour', label: '小时' },
  { value: 'day', label: '天' },
]

// 生成唯一 id（纯前端，无需后端）
export function genId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// 创建一个新步骤
export function createStep(overrides = {}) {
  return {
    id: genId('step'),
    name: '',                 // 步骤名
    type: 'prepare',          // 步骤类型
    duration: { value: 0, unit: 'min' }, // 预计耗时
    inputs: [],               // 输入材料（字符串数组）
    outputs: [],              // 输出结果（字符串数组）
    notes: '',                // 注意事项
    dependencies: [],         // 依赖步骤（步骤 id 数组）
    isKey: false,             // 是否关键步骤
    ...overrides,
  }
}

// 创建一个新流程
export function createProtocol(overrides = {}) {
  return {
    id: genId('proto'),
    name: '未命名流程',
    description: '',
    steps: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

// 把耗时换算成分钟，便于统计与展示
export function durationToMinutes(duration) {
  if (!duration) return 0
  const v = Number(duration.value) || 0
  switch (duration.unit) {
    case 'hour': return v * 60
    case 'day': return v * 60 * 24
    default: return v
  }
}
