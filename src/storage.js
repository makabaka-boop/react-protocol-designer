// 本地存储：全部数据保存在 localStorage，纯前端无后端
import { buildSeedState } from './model.js'

const STORAGE_KEY = 'react-protocol-designer:v1'

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    // 只有“从未保存过”才播种示例数据；
    // 用户主动删光流程（保存了空数组）时应保持空状态，刷新后不应重新出现示例。
    if (!raw) return buildSeedState()
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.workflows)) {
      return buildSeedState()
    }
    if (parsed.workflows.length === 0) {
      return { workflows: [], activeWorkflowId: null, selectedStepId: null }
    }
    if (!parsed.workflows.some((w) => w.id === parsed.activeWorkflowId)) {
      parsed.activeWorkflowId = parsed.workflows[0].id
    }
    return parsed
  } catch (err) {
    console.warn('读取本地数据失败，使用示例数据：', err)
    return buildSeedState()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch (err) {
    console.warn('保存到本地存储失败：', err)
    return false
  }
}

export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.warn('清除本地数据失败：', err)
  }
}
