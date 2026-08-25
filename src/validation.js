export const SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
};

function findCircularDependencies(steps) {
  const issues = [];
  const stepMap = new Map(steps.map((s) => [s.id, s]));
  const visited = new Set();
  const recursionStack = new Set();
  const pathNodes = [];

  function dfs(stepId) {
    if (!stepMap.has(stepId)) return false;
    if (recursionStack.has(stepId)) {
      const cycleStartIdx = pathNodes.indexOf(stepId);
      const cycle = pathNodes.slice(cycleStartIdx).concat(stepId);
      return cycle;
    }
    if (visited.has(stepId)) return false;

    visited.add(stepId);
    recursionStack.add(stepId);
    pathNodes.push(stepId);

    const step = stepMap.get(stepId);
    for (const depId of step.dependencies || []) {
      const cycle = dfs(depId);
      if (cycle) return cycle;
    }

    pathNodes.pop();
    recursionStack.delete(stepId);
    return false;
  }

  for (const step of steps) {
    const cycle = dfs(step.id);
    if (cycle) {
      const cycleNames = cycle.map((id) => {
        const s = stepMap.get(id);
        return s ? s.name || '(未命名)' : '(已删除)';
      });
      issues.push({
        id: `cycle_${step.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        severity: SEVERITY.ERROR,
        type: 'circular_dependency',
        stepId: step.id,
        stepName: step.name || '(未命名)',
        message: `检测到循环依赖：${cycleNames.join(' → ')}`,
      });
      return issues;
    }
  }
  return issues;
}

function findMissingInputs(steps) {
  const issues = [];
  for (const step of steps) {
    if (!step.inputMaterials || step.inputMaterials.length === 0) {
      issues.push({
        id: `no_input_${step.id}`,
        severity: SEVERITY.WARNING,
        type: 'missing_input',
        stepId: step.id,
        stepName: step.name || '(未命名)',
        message: '步骤未填写任何输入材料',
      });
    } else {
      const emptyItems = step.inputMaterials.filter(
        (m) => !m || !m.trim()
      );
      if (emptyItems.length > 0) {
        issues.push({
          id: `empty_input_${step.id}`,
          severity: SEVERITY.WARNING,
          type: 'missing_input',
          stepId: step.id,
          stepName: step.name || '(未命名)',
          message: '存在空白的输入材料项',
        });
      }
    }
  }
  return issues;
}

function findMissingOutputs(steps) {
  const issues = [];
  for (const step of steps) {
    if (!step.outputResults || step.outputResults.length === 0) {
      issues.push({
        id: `no_output_${step.id}`,
        severity: SEVERITY.ERROR,
        type: 'missing_output',
        stepId: step.id,
        stepName: step.name || '(未命名)',
        message: '步骤未定义任何输出结果',
      });
    } else {
      const emptyItems = step.outputResults.filter(
        (r) => !r || !r.trim()
      );
      if (emptyItems.length > 0) {
        issues.push({
          id: `empty_output_${step.id}`,
          severity: SEVERITY.WARNING,
          type: 'missing_output',
          stepId: step.id,
          stepName: step.name || '(未命名)',
          message: '存在空白的输出结果项',
        });
      }
    }
  }
  return issues;
}

function findCriticalStepIssues(steps) {
  const issues = [];
  for (const step of steps) {
    if (step.isCritical) {
      if (!step.notes || !step.notes.trim()) {
        issues.push({
          id: `critical_notes_${step.id}`,
          severity: SEVERITY.ERROR,
          type: 'critical_no_notes',
          stepId: step.id,
          stepName: step.name || '(未命名)',
          message: '关键步骤必须填写注意事项',
        });
      }
    }
  }
  return issues;
}

function findDanglingDependencies(steps) {
  const issues = [];
  const idSet = new Set(steps.map((s) => s.id));
  for (const step of steps) {
    for (const depId of step.dependencies || []) {
      if (!idSet.has(depId)) {
        issues.push({
          id: `dangling_${step.id}_${depId}`,
          severity: SEVERITY.WARNING,
          type: 'dangling_dependency',
          stepId: step.id,
          stepName: step.name || '(未命名)',
          message: '存在指向已删除步骤的依赖关系',
        });
      }
    }
  }
  return issues;
}

function findEmptyNameSteps(steps) {
  const issues = [];
  for (const step of steps) {
    if (!step.name || !step.name.trim()) {
      issues.push({
        id: `empty_name_${step.id}`,
        severity: SEVERITY.WARNING,
        type: 'empty_name',
        stepId: step.id,
        stepName: '(未命名)',
        message: '步骤名称为空',
      });
    }
  }
  return issues;
}

export function validateProtocol(protocol) {
  if (!protocol || !protocol.steps) {
    return { issues: [], errorCount: 0, warningCount: 0, isValid: true };
  }
  const steps = protocol.steps;

  const allIssues = [
    ...findCircularDependencies(steps),
    ...findDanglingDependencies(steps),
    ...findEmptyNameSteps(steps),
    ...findMissingInputs(steps),
    ...findMissingOutputs(steps),
    ...findCriticalStepIssues(steps),
  ];

  const errorCount = allIssues.filter((i) => i.severity === SEVERITY.ERROR).length;
  const warningCount = allIssues.filter((i) => i.severity === SEVERITY.WARNING).length;

  return {
    issues: allIssues,
    errorCount,
    warningCount,
    isValid: errorCount === 0,
  };
}
