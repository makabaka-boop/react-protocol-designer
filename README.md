# react-protocol-designer · 实验流程设计器

一个**纯前端**的实验流程草稿设计工具。在浏览器里可视化编排实验步骤、依赖关系与参数，并实时校验流程问题——不再用文档反复画来画去。

- 技术栈：React 18 + Vite
- **不接后端**，所有数据保存在浏览器 `localStorage`
- 四大工作区：流程列表 · 步骤编辑区 · 依赖关系视图 · 校验结果面板

---

## 启动方式

需要 Node.js（建议 ≥ 18）。

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（默认 http://localhost:5180）
npm run dev

# 3. 生产构建
npm run build

# 4. 本地预览构建产物
npm run preview
```

首次打开时会自动注入一个「蛋白提取示例流程」，方便快速体验；删除后不会再次出现。

---

## 功能一览

| 分类 | 操作 |
| --- | --- |
| 流程 | 新建流程、重命名、编辑描述、导出 JSON、删除流程 |
| 步骤 | 新增步骤、复制步骤、调整顺序（上移/下移）、删除步骤 |
| 步骤字段 | 步骤名、步骤类型、预计耗时、输入材料、输出结果、注意事项、依赖步骤 |
| 关键步骤 | 一键标记 / 取消关键步骤 |
| 依赖 | 勾选式配置依赖，SVG 依赖关系视图按依赖深度自动分层展示 |
| 草稿 | 保存草稿、恢复草稿（恢复后清除该草稿快照，避免旧内容被反复写回） |
| 持久化 | 正式数据自动写入 `localStorage`；草稿单独存储 |

---

## 数据字段

### 流程 Protocol

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 唯一标识 |
| `name` | string | 流程名称 |
| `description` | string | 流程描述 |
| `steps` | Step[] | 步骤列表（有序） |
| `createdAt` / `updatedAt` | number | 时间戳 |

### 步骤 Step

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 唯一标识 |
| `name` | string | 步骤名 |
| `type` | string | 步骤类型：`prepare`/`reaction`/`separation`/`measurement`/`analysis`/`cleanup`/`other` |
| `duration` | `{ value: number, unit }` | 预计耗时，单位 `min`/`hour`/`day`（切换单位仅改单位、不换算数值） |
| `inputs` | string[] | 输入材料 |
| `outputs` | string[] | 输出结果 |
| `notes` | string | 注意事项 |
| `dependencies` | string[] | 依赖步骤的 `id` 列表 |
| `isKey` | boolean | 是否关键步骤 |

### localStorage 存储键

| 键 | 内容 |
| --- | --- |
| `rpd.state.v1` | 正式数据：`{ protocols, activeId }` |
| `rpd.drafts.v1` | 草稿快照：`{ [protocolId]: { snapshot, savedAt } }` |
| `rpd.seeded.v1` | 是否已注入示例流程的标记 |

---

## 校验规则

每次编辑都会实时校验当前流程，问题分为**错误**（🔴，阻断性）与**警告**（🟡，提示性）：

| 级别 | 规则 | 说明 |
| --- | --- | --- |
| 🔴 错误 | **循环依赖** | 使用 Tarjan 强连通分量算法检测，只标记真正处于环中的步骤（不误报环外步骤） |
| 🔴 错误 | **步骤名为空** | 步骤必须有名称 |
| 🔴 错误 | **关键步骤缺少注意事项** | 被标记为关键的步骤必须填写注意事项 |
| 🔴 错误 | **无效依赖 / 依赖自身** | 依赖指向了不存在的步骤，或步骤依赖了自身 |
| 🟡 警告 | **缺少输入材料** | 步骤没有任何输入材料 |
| 🟡 警告 | **没有输出结果** | 步骤没有任何输出结果 |

校验结果面板会汇总所有问题，点击某条问题可快速定位到对应步骤；流程列表与步骤卡片上也会显示错误/警告数量徽标。

---

## 目录结构

```
src/
├─ main.jsx                    # 入口
├─ App.jsx                     # 布局：四大面板
├─ styles.css                  # 样式（窄屏自动堆叠为单列）
├─ context/
│  └─ ProtocolContext.jsx      # 全局状态（reducer + 动作 + 草稿）
├─ lib/
│  ├─ types.js                 # 数据模型、工厂函数、枚举
│  ├─ storage.js               # localStorage 读写、草稿、示例数据、导出
│  └─ validation.js            # 循环依赖检测 + 校验规则
└─ components/
   ├─ Sidebar.jsx              # 流程列表
   ├─ StepList.jsx             # 步骤列表 + 顺序/复制/草稿
   ├─ StepEditor.jsx           # 步骤字段编辑 + 依赖配置 + 关键标记
   ├─ StringListEditor.jsx     # 输入材料 / 输出结果 编辑器
   ├─ DependencyGraph.jsx      # SVG 依赖关系视图（按深度分层）
   └─ ValidationPanel.jsx      # 校验结果面板
```
