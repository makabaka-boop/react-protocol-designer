// 本地存储：草稿的读写
import { createFlow, createStep } from './model.js'

const STORAGE_KEY = 'protocol-designer:flows:v1'

// 清洗单个步骤：字段缺失/类型错误时回填默认值，避免渲染崩溃
function sanitizeStep(s) {
  if (!s || typeof s !== 'object') return null
  const step = createStep({ ...s })
  step.id = typeof s.id === 'string' ? s.id : crypto.randomUUID()
  step.name = String(s.name ?? '')
  step.type = String(s.type ?? '反应')
  step.duration = Number(s.duration) || 0
  step.inputs = Array.isArray(s.inputs) ? s.inputs.map(String) : []
  step.outputs = Array.isArray(s.outputs) ? s.outputs.map(String) : []
  step.notes = String(s.notes ?? '')
  step.critical = Boolean(s.critical)
  step.deps = Array.isArray(s.deps) ? s.deps.filter((d) => typeof d === 'string') : []
  return step
}

// 清洗流程：结构不合法的直接丢弃
function sanitizeFlow(f) {
  if (!f || typeof f !== 'object' || !Array.isArray(f.steps)) return null
  const steps = f.steps.map(sanitizeStep).filter(Boolean)
  // 重复的步骤 id 重新生成，避免 key 冲突
  const seen = new Set()
  for (const s of steps) {
    if (seen.has(s.id)) s.id = crypto.randomUUID()
    seen.add(s.id)
  }
  // 清掉指向不存在步骤的依赖
  const ids = new Set(steps.map((s) => s.id))
  for (const s of steps) s.deps = s.deps.filter((d) => ids.has(d))
  return createFlow({
    id: typeof f.id === 'string' ? f.id : crypto.randomUUID(),
    name: String(f.name ?? '未命名流程'),
    createdAt: Number(f.createdAt) || Date.now(),
    updatedAt: Number(f.updatedAt) || Date.now(),
    steps,
  })
}

export function loadFlows() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return null
    return data.map(sanitizeFlow).filter(Boolean)
  } catch {
    return null
  }
}

export function saveFlows(flows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flows))
}

export function hasDraft() {
  return localStorage.getItem(STORAGE_KEY) !== null
}

export function clearDraft() {
  localStorage.removeItem(STORAGE_KEY)
}
