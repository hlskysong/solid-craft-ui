# Alert 警告提示（`solid-craft/alert`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

页内常驻反馈条：四种语义类型、标题与描述、可关闭、右侧操作区；操作区可直接调用 T2-06 的全局 message 通道，SSR 只输出静态骨架。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/alert/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/alert/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/alert/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/alert/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/alert';
```

## API

### AlertProps

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `kind` | `AlertKind` | — | 反馈语义类型，恒输出为 `data-scui-kind`。 @default 'info' | 否 |
| `title` | `JSX.Element` | — | 标题；省略时只显示描述。 | 否 |
| `description` | `JSX.Element` | — | 描述正文。 | 否 |
| `closable` | `boolean` | — | 是否显示右上角关闭按钮。 @default true | 否 |
| `closeLabel` | `string` | — | 关闭按钮的无障碍文案。 @default '关闭' | 否 |
| `onClose` | `() => void` | — | 点击关闭后触发；组件内部同时移除自身 DOM。 | 否 |
| `action` | `JSX.Element` | — | 右侧操作区；不传时整块不渲染，不留空盒子。 | 否 |
| `children` | `JSX.Element` | — | 补充正文（与 description 并列，供需要富内容的场景使用）。 | 否 |
| `icon` | `JSX.Element \| null` | — | 自定义图标；传 `null` 表示整块不渲染。 @default undefined | 否 |
| `class` | `string` | — | 根节点自定义类名。 @default undefined | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/alert/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
/**
 * `Alert` 的公共类型（T3-09，§4.2 与 `docs/04 §2.4`「类型、可关闭、描述、操作」）。
 *
 * `data-scui-kind` **复用** T2-06 已登记的属性：它表达「一条反馈自身的语义类型」，
 * 与 App / Message / Notification 完全同义，只是取值少一个 `loading`
 * （Alert 是静态页面内提示，没有「进行中」态）。R1 的「一个属性名只表达一个
 * 语义」在这里是复用而非另起新名，别名反而会造成两套选择器。
 *
 * R3：函数型 prop（`onClose`）直接声明为函数，不用 `MaybeAccessor` 包裹。
 */
import type { JSX } from 'solid-js';

/** 反馈语义类型，默认 `info`。 */
export type AlertKind = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  /** 反馈语义类型，恒输出为 `data-scui-kind`。 @default 'info' */
  kind?: AlertKind;
  /** 标题；省略时只显示描述。 */
  title?: JSX.Element;
  /** 描述正文。 */
  description?: JSX.Element;
  /** 是否显示右上角关闭按钮。 @default true */
  closable?: boolean;
  /** 关闭按钮的无障碍文案。 @default '关闭' */
  closeLabel?: string;
  /** 点击关闭后触发；组件内部同时移除自身 DOM。 */
  onClose?: () => void;
  /** 右侧操作区；不传时整块不渲染，不留空盒子。 */
  action?: JSX.Element;
  /** 补充正文（与 description 并列，供需要富内容的场景使用）。 */
  children?: JSX.Element;
  /** 自定义图标；传 `null` 表示整块不渲染。 @default undefined */
  icon?: JSX.Element | null;
  /** 根节点自定义类名。 @default undefined */
  class?: string;
}
```

## 相关 Demo（完整源码见链接页）

- [操作区与全局反馈接入](../demos/alert-action.md)：Alert 的操作区放常规按钮；点击后通过 T2-06 的静态 message 通道给出全局提示——不新建 Message 组件，也不依赖组件树。（源文件 `packages/core/src/components/alert/demos/action.tsx`）
- [四种反馈类型](../demos/alert-basic.md)：info / success / warning / error 共用同一个 data-scui-kind 属性；标题、描述与类型图标都是同一套结构。（源文件 `packages/core/src/components/alert/demos/basic.tsx`）
- [可关闭与关闭回调](../demos/alert-closable.md)：右上角关闭按钮点击后移除整条反馈并触发 onClose；closable=false 与 icon=null 可分别去掉关闭按钮和图标。（源文件 `packages/core/src/components/alert/demos/closable.tsx`）

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
