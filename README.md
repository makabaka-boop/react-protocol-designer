# react-protocol-designer

实验流程编排前端工具：在浏览器里设计实验流程草稿，替代文档画图。纯 React 实现，无后端，草稿保存在浏览器 localStorage。

## 启动方式

```bash
npm install
npm run dev      # 开发模式，默认 http://localhost:5173
npm run build    # 生产构建，输出到 dist/
npm run preview  # 预览生产构建
```

要求 Node.js 18+。

## 功能

- 流程列表：新建、选择、删除流程
- 步骤编辑：新增、复制、删除步骤；拖拽或 ↑↓ 按钮调整顺序；编辑步骤字段；勾选依赖步骤；标记关键步骤
- 依赖关系视图：按拓扑层级自动布局的 SVG 依赖图，点击节点可定位步骤，循环依赖以红色虚线高亮
- 校验结果面板：实时校验，错误/警告分级展示，点击问题可定位到相关步骤
- 草稿管理：「保存草稿」写入 localStorage；「恢复草稿」从 localStorage 读回；「清空草稿」删除本地数据。修改后未保存时标题栏有提示

## 数据字段

localStorage 键：`protocol-designer:flows:v1`，值为流程数组。加载时会逐字段清洗数据：缺失/类型错误的字段回填默认值，结构不合法的流程被丢弃，指向不存在步骤的依赖被清除——即使本地数据损坏也不会导致页面崩溃。

```js
// 流程 Flow
{
  id: string,          // crypto.randomUUID()
  name: string,        // 流程名
  createdAt: number,   // 创建时间戳
  updatedAt: number,   // 最后修改时间戳
  steps: Step[]
}

// 步骤 Step
{
  id: string,          // crypto.randomUUID()
  name: string,        // 步骤名
  type: string,        // 步骤类型：反应/加热/冷却/混合/过滤/洗涤/干燥/检测/其他
  duration: number,    // 预计耗时（分钟）
  inputs: string[],    // 输入材料
  outputs: string[],   // 输出结果
  notes: string,       // 注意事项
  critical: boolean,   // 是否关键步骤
  deps: string[]       // 依赖步骤的 id 列表
}
```

## 校验规则

| 规则 | 级别 | 说明 |
| --- | --- | --- |
| 循环依赖 | 错误 | 依赖图中存在环，给出完整的环路径 |
| 未命名步骤 | 错误 | 步骤名为空 |
| 悬空依赖 | 错误 | 依赖了一个已被删除的步骤 |
| 缺少输入材料 | 警告 | 步骤没有任何输入材料 |
| 输入未由上游产出 | 警告 | 步骤的某个输入材料不匹配任何（传递）上游依赖步骤的输出结果 |
| 没有输出结果 | 警告 | 步骤没有任何输出结果 |
| 关键步骤缺少注意事项 | 错误 | `critical = true` 但注意事项为空 |
| 耗时不合法 | 警告 | 预计耗时不是大于 0 的数字 |

## 技术栈

Vite + React 18，无后端、无额外状态库，组件内 `useState` 管理草稿，校验与拓扑分层为纯函数（`src/lib/validate.js`）。
