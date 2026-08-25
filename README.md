# react-protocol-designer

实验流程草稿设计器 —— 纯前端工具，用于在浏览器中可视化设计实验流程，替代文档画图。基于 React + Vite 构建，数据保存在浏览器 localStorage，无需后端。

## 启动方式

环境要求：Node.js 18+

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 构建生产版本
npm run build

# 本地预览生产构建
npm run preview
```

## 功能概览

- **流程管理**：创建、重命名、删除、切换多个实验流程
- **步骤编辑**：新增、复制、删除步骤，拖拽或按钮调整顺序
- **步骤字段**：步骤名、步骤类型、预计耗时、输入材料、输出结果、注意事项、依赖步骤
- **关键步骤**：一键标记关键步骤（★），关键步骤必须填写注意事项
- **依赖关系**：矩阵式勾选依赖，自动检测循环依赖
- **流程校验**：实时校验，错误/警告分类展示，点击问题可定位到对应步骤
- **草稿机制**：手动保存草稿到本地，随时恢复或丢弃
- **数据持久化**：所有数据自动保存到 localStorage，刷新不丢失

## 界面布局

```
┌────────────┬──────────────────────────────────┬──────────────┐
│            │  工具栏（流程名/描述/草稿操作）     │              │
│  流程列表   ├────────────┬─────────────────────┤  校验结果面板 │
│  侧边栏    │  步骤列表   │  步骤编辑 / 依赖关系  │              │
│            │            │                     │              │
└────────────┴────────────┴─────────────────────┴──────────────┘
```

- 左侧：流程列表（新建/切换/重命名/删除）
- 中左：步骤列表（拖拽排序、复制、删除、标记关键步骤）
- 中间：Tab 切换"步骤编辑"和"依赖关系"视图
- 右侧：实时校验结果面板

## 数据字段

所有数据保存在 localStorage，键名前缀为 `protocol_designer_`。

### Protocol（流程）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识 |
| `name` | string | 流程名称 |
| `description` | string | 流程描述（可选） |
| `steps` | Step[] | 步骤数组，顺序即展示顺序 |
| `createdAt` | number | 创建时间戳 |
| `updatedAt` | number | 更新时间戳 |

### Step（步骤）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识 |
| `name` | string | 步骤名称 |
| `type` | string | 步骤类型：`preparation`(准备)、`reaction`(反应)、`purification`(纯化)、`analysis`(分析检测)、`storage`(保存)、`other`(其他) |
| `estimatedMinutes` | number | 预计耗时（分钟） |
| `inputMaterials` | string[] | 输入材料列表 |
| `outputResults` | string[] | 输出结果列表 |
| `notes` | string | 注意事项 |
| `dependencies` | string[] | 依赖的步骤 ID 列表 |
| `isCritical` | boolean | 是否为关键步骤 |
| `createdAt` | number | 创建时间戳 |
| `updatedAt` | number | 更新时间戳 |

### localStorage 键

| 键 | 内容 |
|----|------|
| `protocol_designer_protocols` | 所有流程数据（JSON 数组） |
| `protocol_designer_current_id` | 当前选中的流程 ID |
| `protocol_designer_drafts` | 各流程保存的草稿（按流程 ID 索引） |

## 校验规则

校验在每次数据变更后实时执行，结果显示在右侧面板。

### 错误（Error，阻断性问题）

| 规则 | 触发条件 |
|------|----------|
| **循环依赖** | 步骤之间的依赖关系形成闭环（如 A→B→C→A），无法确定执行顺序 |
| **缺少输出结果** | 步骤的 `outputResults` 为空数组。每个步骤都应定义产出 |
| **关键步骤缺注意事项** | `isCritical` 为 true 但 `notes` 为空 |

### 警告（Warning，建议修正）

| 规则 | 触发条件 |
|------|----------|
| **悬空依赖** | 步骤依赖了一个已被删除的步骤 ID |
| **缺少输入材料** | 步骤的 `inputMaterials` 为空数组或包含空白项 |
| **输出结果含空白项** | `outputResults` 中存在空字符串 |
| **步骤名为空** | `name` 为空或仅空白字符 |

## 技术栈

- React 18
- Vite 5
- 原生 CSS（无 UI 框架依赖）
- localStorage 持久化

## 项目结构

```
src/
├── components/
│   ├── Sidebar.jsx         # 流程列表侧边栏
│   ├── Toolbar.jsx         # 顶部工具栏（草稿操作）
│   ├── StepList.jsx        # 步骤列表（拖拽排序）
│   ├── StepEditor.jsx      # 步骤编辑表单
│   ├── DependencyView.jsx  # 依赖关系矩阵视图
│   └── ValidationPanel.jsx # 校验结果面板
├── context/
│   └── ProtocolContext.jsx # 全局状态管理
├── types.js                # 数据模型和工厂函数
├── storage.js              # localStorage 封装
├── validation.js           # 流程校验逻辑
├── App.jsx
├── App.css
└── main.jsx
```
