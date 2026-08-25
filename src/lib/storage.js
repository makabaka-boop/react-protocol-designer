// localStorage 持久化层
import { createProtocol, createStep, genId } from './types.js'

const STORAGE_KEY = 'rpd.state.v1'          // 正式数据
const DRAFT_KEY = 'rpd.drafts.v1'           // 草稿（按流程 id 存快照）
const SEED_FLAG_KEY = 'rpd.seeded.v1'       // 是否已注入示例数据

// 构造首次进入时的示例流程，便于快速体验
function buildSampleProtocol() {
  const s1 = createStep({
    name: '配制缓冲液',
    type: 'prepare',
    duration: { value: 20, unit: 'min' },
    inputs: ['Tris 粉末', '去离子水', 'HCl'],
    outputs: ['1L Tris 缓冲液'],
    notes: '注意 pH 调节至 8.0',
  })
  const s2 = createStep({
    name: '样品裂解',
    type: 'reaction',
    duration: { value: 30, unit: 'min' },
    inputs: ['细胞样品', '1L Tris 缓冲液', '裂解酶'],
    outputs: ['裂解液'],
    isKey: true,
    notes: '全程冰上操作，避免蛋白降解',
    dependencies: [s1.id],
  })
  const s3 = createStep({
    name: '离心分离',
    type: 'separation',
    duration: { value: 15, unit: 'min' },
    inputs: ['裂解液'],
    outputs: ['上清液'],
    dependencies: [s2.id],
  })
  const s4 = createStep({
    name: '浓度测定',
    type: 'measurement',
    duration: { value: 40, unit: 'min' },
    inputs: ['上清液'],
    outputs: ['蛋白浓度数据'],
    dependencies: [s3.id],
  })
  return createProtocol({
    name: '蛋白提取示例流程',
    description: '演示用示例，可自由修改或删除。',
    steps: [s1, s2, s3, s4],
  })
}

// 读取正式状态
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== null) {
      // 已存在数据（哪怕是空流程列表）也直接返回，不再注入示例
      const parsed = JSON.parse(raw)
      return {
        protocols: Array.isArray(parsed.protocols) ? parsed.protocols : [],
        activeId: parsed.activeId ?? null,
      }
    }
    // 仅当从未初始化过时才注入示例流程
    if (!localStorage.getItem(SEED_FLAG_KEY)) {
      const sample = buildSampleProtocol()
      const state = { protocols: [sample], activeId: sample.id }
      localStorage.setItem(SEED_FLAG_KEY, '1')
      saveState(state)
      return state
    }
    return { protocols: [], activeId: null }
  } catch (e) {
    console.warn('loadState failed, fallback to empty', e)
    return { protocols: [], activeId: null }
  }
}

// 保存正式状态
export function saveState(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ protocols: state.protocols, activeId: state.activeId })
    )
    // 一旦写入过，即认为已初始化，避免清空后示例重现
    localStorage.setItem(SEED_FLAG_KEY, '1')
  } catch (e) {
    console.warn('saveState failed', e)
  }
}

// —— 草稿相关 ——
function readDrafts() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')
  } catch {
    return {}
  }
}

// 保存某个流程的草稿快照
export function saveDraft(protocol) {
  const drafts = readDrafts()
  drafts[protocol.id] = {
    snapshot: protocol,
    savedAt: Date.now(),
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts))
  return drafts[protocol.id].savedAt
}

// 读取某个流程的草稿
export function getDraft(protocolId) {
  const drafts = readDrafts()
  return drafts[protocolId] || null
}

// 删除某个流程的草稿
export function clearDraft(protocolId) {
  const drafts = readDrafts()
  delete drafts[protocolId]
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts))
}

// 导出为 JSON 文件
export function exportProtocol(protocol) {
  const blob = new Blob([JSON.stringify(protocol, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${protocol.name || 'protocol'}_${genId('exp')}.json`
  a.click()
  URL.revokeObjectURL(url)
}
