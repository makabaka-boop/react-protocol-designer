export const STEP_TYPES = [
  { value: 'preparation', label: '准备' },
  { value: 'reaction', label: '反应' },
  { value: 'purification', label: '纯化' },
  { value: 'analysis', label: '分析检测' },
  { value: 'storage', label: '保存' },
  { value: 'other', label: '其他' },
];

export const STEP_TYPE_MAP = STEP_TYPES.reduce((acc, t) => {
  acc[t.value] = t.label;
  return acc;
}, {});

let idCounter = 0;
export function generateId(prefix = 'id') {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createStep(overrides = {}) {
  return {
    id: generateId('step'),
    name: '',
    type: 'preparation',
    estimatedMinutes: 30,
    inputMaterials: [],
    outputResults: [],
    notes: '',
    dependencies: [],
    isCritical: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function createProtocol(overrides = {}) {
  return {
    id: generateId('protocol'),
    name: '未命名流程',
    description: '',
    steps: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function createDraftFromProtocol(protocol) {
  return {
    ...JSON.parse(JSON.stringify(protocol)),
    draftSavedAt: Date.now(),
  };
}
