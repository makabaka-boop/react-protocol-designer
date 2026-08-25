import { useState } from 'react';
import { useProtocol } from '../context/ProtocolContext';
import { STEP_TYPES } from '../types';

function StringListEditor({ label, items, onChange, placeholder }) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (v) {
      onChange([...(items || []), v]);
      setInput('');
    }
  };

  const remove = (idx) => {
    onChange((items || []).filter((_, i) => i !== idx));
  };

  const update = (idx, value) => {
    onChange((items || []).map((item, i) => (i === idx ? value : item)));
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="string-list">
        {(items || []).map((item, idx) => (
          <div key={idx} className="string-list-item">
            <input
              type="text"
              value={item}
              placeholder={placeholder}
              onChange={(e) => update(idx, e.target.value)}
            />
            <button
              type="button"
              className="btn-icon btn-danger"
              onClick={() => remove(idx)}
            >
              ✕
            </button>
          </div>
        ))}
        <div className="string-list-add">
          <input
            type="text"
            value={input}
            placeholder={`输入后回车添加${label}`}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
          />
          <button type="button" className="btn btn-secondary btn-sm" onClick={add}>
            添加
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StepEditor() {
  const { selectedStep, updateStep, currentProtocol } = useProtocol();

  if (!currentProtocol) {
    return (
      <div className="step-editor empty-state">
        <p>请选择一个流程</p>
      </div>
    );
  }

  if (!selectedStep) {
    return (
      <div className="step-editor empty-state">
        <p>← 从左侧选择一个步骤进行编辑</p>
        <p className="hint">或点击"添加步骤"创建新步骤</p>
      </div>
    );
  }

  const set = (field, value) => {
    updateStep(selectedStep.id, { [field]: value });
  };

  return (
    <div className="step-editor">
      <div className="step-editor-header">
        <h3>编辑步骤</h3>
        {selectedStep.isCritical && <span className="critical-tag">★ 关键步骤</span>}
      </div>
      <div className="step-editor-body">
        <div className="form-group">
          <label>步骤名称</label>
          <input
            type="text"
            value={selectedStep.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="例如：样品前处理"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>步骤类型</label>
            <select
              value={selectedStep.type}
              onChange={(e) => set('type', e.target.value)}
            >
              {STEP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>预计耗时（分钟）</label>
            <input
              type="number"
              min="1"
              value={selectedStep.estimatedMinutes}
              onChange={(e) =>
                set('estimatedMinutes', Math.max(1, parseInt(e.target.value) || 0))
              }
            />
          </div>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={selectedStep.isCritical}
              onChange={(e) => set('isCritical', e.target.checked)}
            />
            <span>标记为关键步骤</span>
          </label>
        </div>

        <StringListEditor
          key={`${selectedStep.id}-input`}
          label="输入材料"
          items={selectedStep.inputMaterials}
          onChange={(v) => set('inputMaterials', v)}
          placeholder="例如：10mL 离心管、样品 A"
        />

        <StringListEditor
          key={`${selectedStep.id}-output`}
          label="输出结果"
          items={selectedStep.outputResults}
          onChange={(v) => set('outputResults', v)}
          placeholder="例如：上清液 5mL"
        />

        <div className="form-group">
          <label>注意事项</label>
          <textarea
            rows={5}
            value={selectedStep.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="记录该步骤需要特别注意的事项、安全要求、参数范围等..."
          />
          {selectedStep.isCritical && (!selectedStep.notes || !selectedStep.notes.trim()) && (
            <div className="field-hint field-hint-error">
              关键步骤必须填写注意事项
            </div>
          )}
        </div>

        <div className="form-group">
          <label>依赖说明</label>
          <div className="dependency-readonly">
            {selectedStep.dependencies?.length > 0 ? (
              <ul>
                {selectedStep.dependencies.map((depId) => {
                  const dep = currentProtocol.steps.find((s) => s.id === depId);
                  return (
                    <li key={depId}>
                      {dep ? dep.name || '(未命名)' : '(已删除的步骤)'}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <span className="hint">无依赖（可在"依赖关系"标签页配置）</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
