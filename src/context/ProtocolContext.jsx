import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { createProtocol, createStep, generateId } from '../types';
import {
  loadProtocols,
  saveProtocols,
  loadCurrentProtocolId,
  saveCurrentProtocolId,
  saveDraft,
  loadDraft,
  deleteDraft,
  hasDraft,
} from '../storage';
import { validateProtocol } from '../validation';

const ProtocolContext = createContext(null);

function createSampleProtocol() {
  const step1 = createStep({
    name: '试剂与材料准备',
    type: 'preparation',
    estimatedMinutes: 20,
    inputMaterials: ['实验方案单', '试剂清单', '防护装备'],
    outputResults: ['配齐的试剂与材料'],
    notes: '检查所有试剂有效期，确认离心机、移液器校准状态。',
  });
  const step2 = createStep({
    name: '样品处理',
    type: 'reaction',
    estimatedMinutes: 45,
    inputMaterials: ['待测样品', '裂解液', '10mL 离心管'],
    outputResults: ['裂解后的样品混合液'],
    notes: '裂解液需现配现用，操作在冰上进行，每 5 分钟涡旋一次。',
    dependencies: [step1.id],
    isCritical: true,
  });
  const step3 = createStep({
    name: '离心分离',
    type: 'purification',
    estimatedMinutes: 15,
    inputMaterials: ['裂解后的样品混合液', '高速离心机'],
    outputResults: ['上清液', '沉淀物'],
    notes: '',
    dependencies: [step2.id],
  });
  const step4 = createStep({
    name: '含量检测',
    type: 'analysis',
    estimatedMinutes: 30,
    inputMaterials: ['上清液'],
    outputResults: ['检测报告与数据'],
    notes: '使用分光光度计，波长设定为 260nm，做三次平行样。',
    dependencies: [step3.id],
    isCritical: true,
  });
  return createProtocol({
    name: '示例：核酸提取流程',
    description: '这是一个示例流程，你可以编辑或删除它，创建自己的实验流程。',
    steps: [step1, step2, step3, step4],
  });
}

function loadInitialProtocols() {
  const stored = loadProtocols();
  if (stored.length > 0) return stored;
  const sample = createSampleProtocol();
  saveProtocols([sample]);
  saveCurrentProtocolId(sample.id);
  return [sample];
}

function loadInitialCurrentId() {
  const stored = loadCurrentProtocolId();
  if (stored) return stored;
  const protocols = loadProtocols();
  return protocols[0]?.id || null;
}

export function ProtocolProvider({ children }) {
  const [protocols, setProtocols] = useState(() => loadInitialProtocols());
  const [currentId, setCurrentId] = useState(() => loadInitialCurrentId());
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [draftStatus, setDraftStatus] = useState({});

  useEffect(() => {
    saveProtocols(protocols);
  }, [protocols]);

  useEffect(() => {
    saveCurrentProtocolId(currentId);
  }, [currentId]);

  useEffect(() => {
    if (protocols.length > 0 && !currentId) {
      setCurrentId(protocols[0].id);
    }
    if (currentId && !protocols.find((p) => p.id === currentId)) {
      setCurrentId(protocols[0]?.id || null);
      setSelectedStepId(null);
    }
  }, [protocols, currentId]);

  useEffect(() => {
    const status = {};
    for (const p of protocols) {
      status[p.id] = hasDraft(p.id);
    }
    setDraftStatus(status);
  }, [protocols]);

  const currentProtocol = useMemo(
    () => protocols.find((p) => p.id === currentId) || null,
    [protocols, currentId]
  );

  const selectedStep = useMemo(() => {
    if (!currentProtocol || !selectedStepId) return null;
    return currentProtocol.steps.find((s) => s.id === selectedStepId) || null;
  }, [currentProtocol, selectedStepId]);

  const validation = useMemo(
    () => validateProtocol(currentProtocol),
    [currentProtocol]
  );

  const createNewProtocol = useCallback((name) => {
    const p = createProtocol({ name: name || '未命名流程' });
    setProtocols((prev) => [...prev, p]);
    setCurrentId(p.id);
    setSelectedStepId(null);
    return p;
  }, []);

  const deleteProtocol = useCallback(
    (id) => {
      setProtocols((prev) => prev.filter((p) => p.id !== id));
      deleteDraft(id);
      if (currentId === id) {
        setSelectedStepId(null);
      }
    },
    [currentId]
  );

  const renameProtocol = useCallback((id, name) => {
    setProtocols((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, name, updatedAt: Date.now() } : p
      )
    );
  }, []);

  const updateProtocolDescription = useCallback((id, description) => {
    setProtocols((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, description, updatedAt: Date.now() } : p
      )
    );
  }, []);

  const selectProtocol = useCallback((id) => {
    setCurrentId(id);
    setSelectedStepId(null);
  }, []);

  const updateCurrentProtocol = useCallback(
    (updater) => {
      setProtocols((prev) =>
        prev.map((p) => {
          if (p.id !== currentId) return p;
          const updated = typeof updater === 'function' ? updater(p) : { ...p, ...updater };
          return { ...updated, updatedAt: Date.now() };
        })
      );
    },
    [currentId]
  );

  const addStep = useCallback(() => {
    const step = createStep({ name: `步骤 ${Date.now().toString().slice(-4)}` });
    updateCurrentProtocol((p) => ({
      ...p,
      steps: [...p.steps, step],
    }));
    setSelectedStepId(step.id);
    return step;
  }, [updateCurrentProtocol]);

  const updateStep = useCallback(
    (stepId, updates) => {
      updateCurrentProtocol((p) => ({
        ...p,
        steps: p.steps.map((s) =>
          s.id === stepId
            ? { ...s, ...updates, updatedAt: Date.now() }
            : s
        ),
      }));
    },
    [updateCurrentProtocol]
  );

  const deleteStep = useCallback(
    (stepId) => {
      updateCurrentProtocol((p) => ({
        ...p,
        steps: p.steps
          .filter((s) => s.id !== stepId)
          .map((s) => ({
            ...s,
            dependencies: (s.dependencies || []).filter((d) => d !== stepId),
          })),
      }));
      if (selectedStepId === stepId) {
        setSelectedStepId(null);
      }
    },
    [updateCurrentProtocol, selectedStepId]
  );

  const duplicateStep = useCallback(
    (stepId) => {
      const source = currentProtocol?.steps.find((s) => s.id === stepId);
      if (!source) return null;
      const copy = {
        ...JSON.parse(JSON.stringify(source)),
        id: generateId('step'),
        name: `${source.name || '步骤'} (副本)`,
        dependencies: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const idx = currentProtocol.steps.findIndex((s) => s.id === stepId);
      updateCurrentProtocol((p) => {
        const newSteps = [...p.steps];
        newSteps.splice(idx + 1, 0, copy);
        return { ...p, steps: newSteps };
      });
      setSelectedStepId(copy.id);
      return copy;
    },
    [currentProtocol, updateCurrentProtocol]
  );

  const moveStep = useCallback(
    (fromIndex, toIndex) => {
      updateCurrentProtocol((p) => {
        const steps = [...p.steps];
        if (fromIndex < 0 || fromIndex >= steps.length) return p;
        if (toIndex < 0 || toIndex >= steps.length) return p;
        const [moved] = steps.splice(fromIndex, 1);
        steps.splice(toIndex, 0, moved);
        return { ...p, steps };
      });
    },
    [updateCurrentProtocol]
  );

  const toggleDependency = useCallback(
    (stepId, depId) => {
      if (stepId === depId) return;
      updateCurrentProtocol((p) => ({
        ...p,
        steps: p.steps.map((s) => {
          if (s.id !== stepId) return s;
          const deps = s.dependencies || [];
          const has = deps.includes(depId);
          return {
            ...s,
            dependencies: has
              ? deps.filter((d) => d !== depId)
              : [...deps, depId],
            updatedAt: Date.now(),
          };
        }),
      }));
    },
    [updateCurrentProtocol]
  );

  const toggleCritical = useCallback(
    (stepId) => {
      updateCurrentProtocol((p) => ({
        ...p,
        steps: p.steps.map((s) =>
          s.id === stepId ? { ...s, isCritical: !s.isCritical } : s
        ),
      }));
    },
    [updateCurrentProtocol]
  );

  const saveCurrentDraft = useCallback(() => {
    if (!currentProtocol) return null;
    const saved = saveDraft(currentProtocol.id, currentProtocol);
    setDraftStatus((prev) => ({ ...prev, [currentProtocol.id]: true }));
    return saved;
  }, [currentProtocol]);

  const restoreDraft = useCallback(() => {
    if (!currentProtocol) return false;
    const draft = loadDraft(currentProtocol.id);
    if (!draft) return false;
    const { draftSavedAt, ...protocolData } = draft;
    setProtocols((prev) =>
      prev.map((p) => (p.id === currentProtocol.id ? protocolData : p))
    );
    deleteDraft(currentProtocol.id);
    setDraftStatus((prev) => ({ ...prev, [currentProtocol.id]: false }));
    setSelectedStepId(null);
    return true;
  }, [currentProtocol]);

  const discardDraft = useCallback(() => {
    if (!currentProtocol) return;
    deleteDraft(currentProtocol.id);
    setDraftStatus((prev) => ({ ...prev, [currentProtocol.id]: false }));
  }, [currentProtocol]);

  const value = {
    protocols,
    currentProtocol,
    currentId,
    selectedStep,
    selectedStepId,
    validation,
    draftStatus,
    setSelectedStepId,
    selectProtocol,
    createNewProtocol,
    deleteProtocol,
    renameProtocol,
    updateProtocolDescription,
    addStep,
    updateStep,
    deleteStep,
    duplicateStep,
    moveStep,
    toggleDependency,
    toggleCritical,
    saveCurrentDraft,
    restoreDraft,
    discardDraft,
  };

  return (
    <ProtocolContext.Provider value={value}>
      {children}
    </ProtocolContext.Provider>
  );
}

export function useProtocol() {
  const ctx = useContext(ProtocolContext);
  if (!ctx) throw new Error('useProtocol must be used within ProtocolProvider');
  return ctx;
}
