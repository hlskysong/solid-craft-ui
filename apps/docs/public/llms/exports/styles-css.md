# 子路径 `solid-craft/styles.css`

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

`solid-craft/styles.css` 是 `solid-craft` 的公开子路径，条件导出如下。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/styles.css.d.ts` | TypeScript 声明入口 |
| `default` | `./dist/styles/index.css` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/styles.css';
```

## API

该子路径不暴露组件 Props。

## 样式引入约定

```ts
// 全量
import 'solid-craft/styles.css';

// 按需
import 'solid-craft/styles/base.css';
import 'solid-craft/styles/components/button.css';
```

JS 不隐式引入 CSS；所有 CSS 变量由 `solid-craft-tokens` 的 DTCG 源生成，统一以 `--scui-` 开头。

## 相关规范

> 规范摘录：`docs/02-架构设计.md` → ### 3.2 消费方式


```tsx
// 推荐：按组件引入（tree-shaking 最稳）
import { Button } from 'solid-craft/button';
import 'solid-craft/styles.css';

// 或：根导出
import { Button, Input, Form } from 'solid-craft';
```

CSS 采用**显式引入**，原因：

- 避免 JS 隐式副作用，SSR / Webpack / Rspack / 微前端行为可预测。
- 允许两种粒度：
  - 全量：`import 'solid-craft/styles.css'`（tokens + base + 所有组件）
  - 按需：`import 'solid-craft/styles/base.css'` + `import 'solid-craft/styles/components/button.css'`
- 后续可提供 `unplugin-solid-craft` 自动按需引入 CSS，但不作为 v1 前置条件。

> 注意：CSS 显式引入意味着业务方必须记得加。文档、脚手架模板、lint 提示中都要强调；`examples/*` 作为正确用法基准。

> 规范摘录：`docs/03-设计系统.md` → ### 2.2 命名规范


```text
--scui-{category}-{role}-{state?}
```

| 类别 | 示例 |
| --- | --- |
| 颜色 | `--scui-color-primary`、`--scui-color-primary-hover`、`--scui-color-text-secondary` |
| 背景 | `--scui-color-bg-container`、`--scui-color-bg-layout`、`--scui-color-bg-elevated` |
| 边框 | `--scui-color-border`、`--scui-color-border-secondary` |
| 填充 | `--scui-color-fill`、`--scui-color-fill-secondary` |
| 字体 | `--scui-font-family`、`--scui-font-size-md`、`--scui-line-height-md` |
| 间距 | `--scui-space-xs`、`--scui-space-sm`、`--scui-space-md` |
| 圆角 | `--scui-radius-sm`、`--scui-radius-md`、`--scui-radius-lg` |
| 阴影 | `--scui-shadow-sm`、`--scui-shadow-md`、`--scui-shadow-popup` |
| 动效 | `--scui-motion-duration-fast`、`--scui-motion-ease` |
| 层级 | `--scui-z-index-dropdown`、`--scui-z-index-modal` |
| 组件 | `--scui-button-height-md`、`--scui-table-row-height` |
