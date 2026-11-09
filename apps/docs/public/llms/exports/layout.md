# Layout 布局（`solid-craft/layout`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

Header / Sider / Content / Footer 页面骨架与可折叠侧边栏。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/layout/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/layout/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/layout/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/layout/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/layout';
```

## API

### LayoutProps

继承：`Omit<   JSX.HTMLAttributes<HTMLDivElement>,   'class' \| 'children' >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `hasSider` | `boolean` | `false` | 是否包含侧边栏，包含时布局改为水平排列。 | 否 |
| `class` | `string` | `undefined` | 自定义类名。 | 否 |
| `children` | `JSX.Element` | `undefined` | 布局内容。 | 否 |

### HeaderProps

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `class` | `string` | `undefined` | 自定义类名。 | 否 |
| `children` | `JSX.Element` | `undefined` | 头部内容。 | 否 |

### ContentProps

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `class` | `string` | `undefined` | 自定义类名。 | 否 |
| `children` | `JSX.Element` | `undefined` | 内容区内容。 | 否 |

### FooterProps

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `class` | `string` | `undefined` | 自定义类名。 | 否 |
| `children` | `JSX.Element` | `undefined` | 底部内容。 | 否 |

### SiderProps

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `collapsed` | `MaybeAccessor<boolean>` | `undefined` | 是否折叠；传入后为受控模式。 | 否 |
| `defaultCollapsed` | `boolean` | `false` | 非受控模式下的初始折叠状态。 | 否 |
| `collapsible` | `boolean` | `false` | 是否显示折叠触发器。 | 否 |
| `width` | `number` | `200` | 展开时的宽度（px）。 | 否 |
| `collapsedWidth` | `number` | `64` | 折叠时的宽度（px）。 | 否 |
| `onCollapse` | `(collapsed: boolean) => void` | `undefined` | 折叠状态变化时的回调。 | 否 |
| `trigger` | `JSX.Element` | `undefined` | 自定义折叠触发器内容。 | 否 |
| `class` | `string` | `undefined` | 自定义类名。 | 否 |
| `children` | `JSX.Element` | `undefined` | 侧边栏内容。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/layout/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
import type { JSX } from 'solid-js';
import type { MaybeAccessor } from '../../utils/resolve-value';

export interface LayoutProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'class' | 'children'
> {
  /**
   * 是否包含侧边栏，包含时布局改为水平排列。
   * @default false
   */
  hasSider?: boolean;
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 布局内容。
   * @default undefined
   */
  children?: JSX.Element;
}

export interface HeaderProps {
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 头部内容。
   * @default undefined
   */
  children?: JSX.Element;
}

export interface ContentProps {
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 内容区内容。
   * @default undefined
   */
  children?: JSX.Element;
}

export interface FooterProps {
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 底部内容。
   * @default undefined
   */
  children?: JSX.Element;
}

export interface SiderProps {
  /**
   * 是否折叠；传入后为受控模式。
   * @default undefined
   */
  collapsed?: MaybeAccessor<boolean>;
  /**
   * 非受控模式下的初始折叠状态。
   * @default false
   */
  defaultCollapsed?: boolean;
  /**
   * 是否显示折叠触发器。
   * @default false
   */
  collapsible?: boolean;
  /**
   * 展开时的宽度（px）。
   * @default 200
   */
  width?: number;
  /**
   * 折叠时的宽度（px）。
   * @default 64
   */
  collapsedWidth?: number;
  /**
   * 折叠状态变化时的回调。
   * @default undefined
   */
  onCollapse?: (collapsed: boolean) => void;
  /**
   * 自定义折叠触发器内容。
   * @default undefined
   */
  trigger?: JSX.Element;
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 侧边栏内容。
   * @default undefined
   */
  children?: JSX.Element;
}
```

## 相关 Demo（完整源码见链接页）

- [基础用法](../demos/layout-basic.md)：带侧边栏的三段布局，含可折叠触发器。（源文件 `packages/core/src/components/layout/demos/basic.tsx`）

## 相关规范

> 规范摘录：`docs/02-架构设计.md` → ### 6.1 命名与 Props


```tsx
export interface ButtonProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: 'solid' | 'outline' | 'dashed' | 'text' | 'link';
  /** 语义色，默认 primary（v0.3 / Q16 已定） */
  color?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  block?: boolean;
  loading?: boolean;
  icon?: JSX.Element;
  iconPosition?: 'start' | 'end';
  shape?: 'default' | 'round' | 'circle';
  htmlType?: 'button' | 'submit' | 'reset';
}
```

约定：

- 尺寸统一 `small | medium | large`（24 / 32 / 40 px），与 TDesign/AntD 习惯一致。
- 变体统一 `variant` + `color`；表单状态统一 `status: 'error' | 'warning' | 'success'`。
- 继承原生属性；`class` / `style` 合并而不是覆盖。
- `ref` 支持 `HTMLElement` 或回调；不额外发明 `forwardRef`。
- 布尔 prop 用肯定语义：`disabled`、`loading`、`block`、`clearable`、`searchable`。
- 不使用 `isXxx` 前缀；不使用 `onXxxChange` 之外的自定义事件名。
