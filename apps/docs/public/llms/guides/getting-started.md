# 快速开始

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json` + `docs/02-架构设计.md` + `generated/api/config-provider.json`；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

安装、引入 CSS、ConfigProvider 与三端构建器接入。

## 安装

```sh
pnpm add solid-craft@0.1.0 solid-craft-tokens solid-craft-icons solid-js
```

## 引入样式（必须显式）

```ts
import 'solid-craft/styles.css';
```

## ConfigProvider

```tsx
import { ConfigProvider } from 'solid-craft';

<ConfigProvider theme="light" density="default" direction="ltr" themeTarget="global">
  <App />
</ConfigProvider>
```

### ConfigProviderProps

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `locale` | `MaybeAccessor<string>` | `'zh-CN'` | 语言标识。 | 否 |
| `theme` | `MaybeAccessor<ThemeName>` | `'light'` | 主题；`system` 仅在客户端跟随系统偏好。 | 否 |
| `density` | `MaybeAccessor<Density>` | `'default'` | 界面密度。 | 否 |
| `direction` | `MaybeAccessor<Direction>` | `'ltr'` | 文字与布局方向。 | 否 |
| `zIndexBase` | `MaybeAccessor<number>` | `0` | 浮层 z-index 的基础值，组件通过 CSS 变量叠加偏移量。 | 否 |
| `portalContainer` | `MaybeAccessor<HTMLElement \| undefined>` | `undefined` | 浮层挂载容器；未提供时懒加载为 `document.body`。 | 否 |
| `themeTarget` | `MaybeAccessor<'global' \| 'local'>` | `'local'` | 主题作用目标；`local` 写到包裹元素，`global` 写到 `document.documentElement`。 | 否 |
| `class` | `string` | `undefined` | 包裹元素的自定义类名。 | 否 |
| `children` | `JSX.Element` | `undefined` | 子树内容。 | 否 |

### UIConfig

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `locale` | `Accessor<string>` | — | 当前语言标识。 | 是 |
| `theme` | `Accessor<ThemeName>` | — | 当前主题；`system` 已在客户端解析为 `light` / `dark`，服务端一律为 `light`。 | 是 |
| `density` | `Accessor<Density>` | — | 当前界面密度。 | 是 |
| `direction` | `Accessor<Direction>` | — | 当前文字与布局方向。 | 是 |
| `zIndexBase` | `Accessor<number>` | — | 当前浮层 z-index 基础值。 | 是 |
| `portalContainer` | `Accessor<HTMLElement \| undefined>` | — | 当前浮层挂载容器；调用时才解析默认值。 | 是 |


## 构建器接入

- [Vite](../guides/vite.md) · [Webpack 5](../guides/webpack.md) · [Rspack](../guides/rspack.md)：三端真实配置与入口源码
- [SSR 与 Hydration](../guides/ssr.md)：SolidStart 与 `"solid"` 条件导出

## 规范摘录

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
