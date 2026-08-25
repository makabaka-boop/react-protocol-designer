import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useCallback,
} from 'react'
import {
  createProtocol,
  createStep,
} from '../lib/types.js'
import {
  loadState,
  saveState,
  saveDraft,
  getDraft,
  clearDraft,
} from '../lib/storage.js'

const ProtocolContext = createContext(null)

// —— reducer ——
function reducer(state, action) {
  switch (action.type) {
    case 'ADD_PROTOCOL': {
      const p = createProtocol(action.payload || {})
      return { ...state, protocols: [...state.protocols, p], activeId: p.id, activeStepId: null }
    }
    case 'DELETE_PROTOCOL': {
      const protocols = state.protocols.filter((p) => p.id !== action.id)
      const activeId =
        state.activeId === action.id ? (protocols[0]?.id ?? null) : state.activeId
      return { ...state, protocols, activeId, activeStepId: null }
    }
    case 'SELECT_PROTOCOL':
      return { ...state, activeId: action.id, activeStepId: null }
    case 'UPDATE_PROTOCOL_META': {
      const protocols = state.protocols.map((p) =>
        p.id === action.id ? { ...p, ...action.payload, updatedAt: Date.now() } : p
      )
      return { ...state, protocols }
    }
    case 'SELECT_STEP':
      return { ...state, activeStepId: action.id }

    // 以下 action 都作用在当前激活流程的 steps 上
    case 'ADD_STEP':
    case 'COPY_STEP':
    case 'DELETE_STEP':
    case 'UPDATE_STEP':
    case 'MOVE_STEP':
    case 'REPLACE_STEPS': {
      let nextActiveStep = state.activeStepId
      const protocols = state.protocols.map((p) => {
        if (p.id !== state.activeId) return p
        let steps = p.steps

        if (action.type === 'ADD_STEP') {
          const s = createStep(action.payload || {})
          steps = [...steps, s]
          nextActiveStep = s.id
        } else if (action.type === 'COPY_STEP') {
          const src = steps.find((x) => x.id === action.id)
          if (src) {
            // 基于源步骤复制，createStep 会分配全新 id（覆盖源 id）
            const { id: _omit, ...rest } = src
            const copy = createStep({
              ...rest,
              name: `${src.name || '步骤'} 副本`,
            })
            const idx = steps.findIndex((x) => x.id === action.id)
            steps = [...steps.slice(0, idx + 1), copy, ...steps.slice(idx + 1)]
            nextActiveStep = copy.id
          }
        } else if (action.type === 'DELETE_STEP') {
          steps = steps
            .filter((x) => x.id !== action.id)
            // 同时清理其它步骤对该步骤的依赖
            .map((x) => ({
              ...x,
              dependencies: (x.dependencies || []).filter((d) => d !== action.id),
            }))
          if (nextActiveStep === action.id) nextActiveStep = steps[0]?.id ?? null
        } else if (action.type === 'UPDATE_STEP') {
          steps = steps.map((x) =>
            x.id === action.id ? { ...x, ...action.payload } : x
          )
        } else if (action.type === 'MOVE_STEP') {
          const { from, to } = action
          if (to >= 0 && to < steps.length && from >= 0 && from < steps.length) {
            const next = [...steps]
            const [moved] = next.splice(from, 1)
            next.splice(to, 0, moved)
            steps = next
          }
        } else if (action.type === 'REPLACE_STEPS') {
          steps = action.steps
        }

        return { ...p, steps, updatedAt: Date.now() }
      })
      return { ...state, protocols, activeStepId: nextActiveStep }
    }

    case 'RESTORE_PROTOCOL': {
      // 用草稿快照整体替换某个流程
      const protocols = state.protocols.map((p) =>
        p.id === action.protocol.id ? action.protocol : p
      )
      return { ...state, protocols, activeStepId: null }
    }

    case 'IMPORT_STATE':
      return { ...action.state, activeStepId: null }

    default:
      return state
  }
}

function init() {
  const s = loadState()
  return { ...s, activeStepId: null }
}

export function ProtocolProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  // 正式状态自动持久化
  useEffect(() => {
    saveState({ protocols: state.protocols, activeId: state.activeId })
  }, [state.protocols, state.activeId])

  const activeProtocol = useMemo(
    () => state.protocols.find((p) => p.id === state.activeId) || null,
    [state.protocols, state.activeId]
  )

  const activeStep = useMemo(
    () => activeProtocol?.steps.find((s) => s.id === state.activeStepId) || null,
    [activeProtocol, state.activeStepId]
  )

  // —— 动作封装 ——
  const actions = useMemo(() => ({
    addProtocol: (payload) => dispatch({ type: 'ADD_PROTOCOL', payload }),
    deleteProtocol: (id) => {
      // 删除流程的同时清除其草稿快照，避免草稿残留
      clearDraft(id)
      dispatch({ type: 'DELETE_PROTOCOL', id })
    },
    selectProtocol: (id) => dispatch({ type: 'SELECT_PROTOCOL', id }),
    updateProtocolMeta: (id, payload) =>
      dispatch({ type: 'UPDATE_PROTOCOL_META', id, payload }),

    selectStep: (id) => dispatch({ type: 'SELECT_STEP', id }),
    addStep: (payload) => dispatch({ type: 'ADD_STEP', payload }),
    copyStep: (id) => dispatch({ type: 'COPY_STEP', id }),
    deleteStep: (id) => dispatch({ type: 'DELETE_STEP', id }),
    updateStep: (id, payload) => dispatch({ type: 'UPDATE_STEP', id, payload }),
    moveStep: (from, to) => dispatch({ type: 'MOVE_STEP', from, to }),
  }), [])

  // —— 草稿：保存当前激活流程的快照 ——
  const saveActiveDraft = useCallback(() => {
    if (!activeProtocol) return null
    return saveDraft(activeProtocol)
  }, [activeProtocol])

  // —— 草稿：恢复当前激活流程 ——
  const restoreActiveDraft = useCallback(() => {
    if (!activeProtocol) return false
    const draft = getDraft(activeProtocol.id)
    if (!draft) return false
    dispatch({ type: 'RESTORE_PROTOCOL', protocol: draft.snapshot })
    // 恢复后清除草稿，避免旧内容被反复写回
    clearDraft(activeProtocol.id)
    return true
  }, [activeProtocol])

  const value = {
    state,
    activeProtocol,
    activeStep,
    ...actions,
    saveActiveDraft,
    restoreActiveDraft,
    getDraft,
  }

  return <ProtocolContext.Provider value={value}>{children}</ProtocolContext.Provider>
}

export function useProtocol() {
  const ctx = useContext(ProtocolContext)
  if (!ctx) throw new Error('useProtocol must be used within ProtocolProvider')
  return ctx
}
