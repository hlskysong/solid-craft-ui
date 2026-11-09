# ConfigProvider 全局配置（`solid-craft/config-provider`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

全局配置上下文，注入主题 / 密度 / 方向 / 语言 / z-index，注入值一律为 getter。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/config-provider/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/config-provider/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/config-provider/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/config-provider/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/config-provider';
```

## API

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


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/config-provider/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
import type { Accessor, JSX } from 'solid-js';
import type { MaybeAccessor } from '../utils/resolve-value';

/** 主题名称；`system` 会在客户端按系统偏好解析为 `light` / `dark`。 */
export type ThemeName = 'light' | 'dark' | 'system';

/** 界面密度。 */
export type Density = 'default' | 'compact';

/** 文字与布局方向。 */
export type Direction = 'ltr' | 'rtl';

export interface ConfigProviderProps {
  /**
   * 语言标识。
   * @default 'zh-CN'
   */
  locale?: MaybeAccessor<string>;
  /**
   * 主题；`system` 仅在客户端跟随系统偏好。
   * @default 'light'
   */
  theme?: MaybeAccessor<ThemeName>;
  /**
   * 界面密度。
   * @default 'default'
   */
  density?: MaybeAccessor<Density>;
  /**
   * 文字与布局方向。
   * @default 'ltr'
   */
  direction?: MaybeAccessor<Direction>;
  /**
   * 浮层 z-index 的基础值，组件通过 CSS 变量叠加偏移量。
   * @default 0
   */
  zIndexBase?: MaybeAccessor<number>;
  /**
   * 浮层挂载容器；未提供时懒加载为 `document.body`。
   * @default undefined
   */
  portalContainer?: MaybeAccessor<HTMLElement | undefined>;
  /**
   * 主题作用目标；`local` 写到包裹元素，`global` 写到 `document.documentElement`。
   * @default 'local'
   */
  themeTarget?: MaybeAccessor<'global' | 'local'>;
  /**
   * 包裹元素的自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 子树内容。
   * @default undefined
   */
  children?: JSX.Element;
}

export interface UIConfig {
  /** 当前语言标识。 */
  locale: Accessor<string>;
  /** 当前主题；`system` 已在客户端解析为 `light` / `dark`，服务端一律为 `light`。 */
  theme: Accessor<ThemeName>;
  /** 当前界面密度。 */
  density: Accessor<Density>;
  /** 当前文字与布局方向。 */
  direction: Accessor<Direction>;
  /** 当前浮层 z-index 基础值。 */
  zIndexBase: Accessor<number>;
  /** 当前浮层挂载容器；调用时才解析默认值。 */
  portalContainer: Accessor<HTMLElement | undefined>;
}
```
