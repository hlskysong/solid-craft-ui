# 根入口 `solid-craft`

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

`solid-craft` 是 `solid-craft` 的公开子路径，条件导出如下。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft';
```

## API

该子路径不暴露组件 Props。

## 根入口导出清单

- `solid-craft/button` → Button 按钮：触发操作的主控件，支持变体、语义色、尺寸、形状、加载与图标。
- `solid-craft/icon` → Icon 图标：语义色与尺寸统一的图标容器，装饰性图标自动对读屏隐藏。
- `solid-craft/typography` → Typography 排版：Title / Text / Paragraph / Link 的层级、修饰与语义色。
- `solid-craft/space` → Space 间距：水平 / 垂直排列、间距档位、分隔与换行。
- `solid-craft/divider` → Divider 分割线：水平 / 垂直分割，支持虚线与带文字。
- `solid-craft/layout` → Layout 布局：Header / Sider / Content / Footer 页面骨架与可折叠侧边栏。
- `solid-craft/grid` → Grid 栅格：24 栅格 Row / Col、间距、偏移与响应式断点。
- `solid-craft/input` → Input 输入框：单行 / 多行输入，前后缀、清除、密码显隐、回车搜索、自动高度与字数统计。

- `solid-craft/config-provider` → ConfigProvider 全局配置

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
