# 实验流程设计器（react-protocol-designer）

纯前端的实验流程草稿设计工具：在浏览器里创建实验流程、编排步骤、配置依赖关系，并自动校验流程问题。**无需后端，所有数据保存在浏览器 localStorage 中**，刷新页面不丢失。

## 功能一览

- **流程列表**：新建 / 切换 / 重命名 / 删除多个实验流程，自动记录更新时间与步骤数。
- **步骤编辑区**：新增步骤、复制步骤、删除步骤；支持拖拽卡片（左侧 ⠿ 手柄）或 ↑/↓ 按钮调整顺序。
- **步骤字段**：步骤名、步骤类型、预计耗时（分钟/小时/天）、输入材料、输出结果、注意事项、依赖步骤、关键步骤标记。
- **依赖配置**：复选框勾选前置步骤；若勾选后会形成循环依赖，该选项自动禁用并提示。
- **依赖关系视图**：SVG 自动布局的流程图（前置 → 后续），关键步骤金色描边、有问题的步骤红/橙描边，点击节点可选中步骤。
- **校验结果面板**：实时校验，错误/警告分色展示，点击问题可定位到对应步骤。
- **草稿保存 / 恢复**：任意修改自动保存；「保存草稿」可把当前步骤列表存为命名快照，之后可在草稿箱恢复或删除（每个流程最多保留 20 份）。

## 启动方式

环境要求：Node.js 18+。

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 3. 构建生产产物
npm run build

# 4. 本地预览生产构建
npm run preview
```

首次打开会加载一个内置示例流程（BCA 蛋白浓度测定），可直接在此基础上修改或新建流程。

## 数据字段

所有数据保存在浏览器 localStorage，键名：`react-protocol-designer:v1`，结构如下：

```jsonc
{
  "workflows": [Workflow],        // 全部流程
  "activeWorkflowId": "wf_xxx",   // 当前选中的流程 id
  "selectedStepId": "step_xxx"    // 当前选中的步骤 id
}
```

### Workflow（流程）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 流程唯一 id |
| `name` | string | 流程名称（页头可直接编辑） |
| `createdAt` | number | 创建时间戳（ms） |
| `updatedAt` | number | 最近修改时间戳（ms） |
| `steps` | Step[] | 步骤列表，**数组顺序即步骤展示顺序** |
| `drafts` | Draft[] | 该流程保存的草稿快照列表 |

### Step（步骤）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 步骤唯一 id |
| `name` | string | 步骤名 |
| `type` | string | 步骤类型：准备 / 试剂配制 / 样本处理 / 反应/孵育 / 检测 / 数据分析 / 清洁收尾 / 其他 |
| `durationMin` | number | 预计耗时，统一以**分钟**存储（界面可按分钟/小时/天输入，自动换算） |
| `inputMaterials` | string[] | 输入材料列表（标签式录入） |
| `outputResults` | string[] | 输出结果列表（标签式录入） |
| `notes` | string | 注意事项（关键步骤必填） |
| `dependencies` | string[] | 依赖的前置步骤 **id** 列表；删除步骤时会自动清理引用 |
| `isKey` | boolean | 是否为关键步骤 |

### Draft（草稿快照）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 草稿唯一 id |
| `name` | string | 草稿名称（保存时可命名，默认带时间戳） |
| `savedAt` | number | 保存时间戳（ms） |
| `workflowName` | string | 保存时的流程名称快照 |
| `steps` | Step[] | 保存时刻的步骤列表深拷贝 |

## 校验规则

每次编辑都会实时校验，结果显示在右下角「校验结果」面板；步骤卡片和依赖图节点上也会同步标记问题数量/颜色。

| 规则 | 级别 | 说明 |
| --- | --- | --- |
| 循环依赖 | ❌ 错误 | 依赖图中存在环（如 A 依赖 B、B 又依赖 A），消息会给出完整环路，如 `A → B → A` |
| 悬空依赖 | ❌ 错误 | 步骤依赖了已不存在的步骤（通常因删除步骤导致，正常删除会自动清理） |
| 步骤名为空 | ❌ 错误 | 步骤名清空后未填写 |
| 关键步骤缺少注意事项 | ❌ 错误 | `isKey = true` 且注意事项为空白 |
| 缺少输入材料 | ⚠️ 警告 | `inputMaterials` 为空或全为空白 |
| 没有输出结果 | ⚠️ 警告 | `outputResults` 为空或全为空白 |
| 预计耗时无效 | ⚠️ 警告 | `durationMin` 为空或 ≤ 0 |

- **错误（error）** 会阻断「校验通过」状态；**警告（warning）** 不阻断，但建议处理。
- 依赖环检测使用 DFS 三色标记法（见 [validation.js](src/validation.js) 的 `findCycles`）；配置依赖时若勾选会立即成环，界面前置禁用该选项（`wouldCreateCycle`），面板校验用于兜底历史数据。
- 点击校验面板中的问题，会自动选中并定位到对应步骤，表单顶部同时列出该步骤的全部问题。

## 目录结构

```
src/
├── main.jsx                 # 入口
├── App.jsx                  # 全局状态与布局（流程/步骤/草稿操作）
├── styles.css               # 全部样式
├── model.js                 # 数据工厂函数、常量、示例数据
├── storage.js               # localStorage 读写
├── validation.js            # 校验规则（循环依赖等）
└── components/
    ├── WorkflowList.jsx     # 左侧流程列表
    ├── StepList.jsx         # 步骤卡片列表（拖拽排序、复制、删除）
    ├── StepForm.jsx         # 步骤编辑表单（含依赖配置）
    ├── TagInput.jsx         # 材料/结果标签输入
    ├── DependencyGraph.jsx  # SVG 依赖关系图
    ├── ValidationPanel.jsx  # 校验结果面板
    └── DraftModal.jsx       # 草稿箱弹窗
```

## 技术栈

- React 18（函数组件 + Hooks）
- Vite 5 构建
- 纯原生 CSS 与手写 SVG 依赖图，无其他运行时依赖
