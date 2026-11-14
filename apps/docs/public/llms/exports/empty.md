# Empty 空状态（`solid-craft/empty`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

插画 + 描述 + 可选操作区；内置插画随主题取 currentColor，image 传 null 可退化为纯文字空状态。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/empty/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/empty/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/empty/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/empty/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/empty';
```

## API

### EmptyProps

继承：`Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' \| 'style'>`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `description` | `JSX.Element` | `'暂无数据'` | 描述文案。传节点而不是字符串，是因为业务经常要带一个「新建」链接或代码片段。 | 否 |
| `image` | `JSX.Element \| null` | `内置线框插画` | 自定义插画。给了就整体替换内置图形（不是叠加）。 内置图形带 `aria-hidden`，自定义插画由调用方自己决定是否可读。 显式传 `null` 表示**不要插画**（纯文字空状态）；不传则用内置图形。 | 否 |
| `size` | `EmptySize` | `'medium'` | 尺寸档。 | 否 |
| `children` | `JSX.Element` | `undefined` | 底部操作区，通常放一个主按钮（例如「新建第一条记录」）。 不传则不渲染该区块，DOM 里不留空壳。 | 否 |
| `style` | `string` | — | 根节点样式；与 `class` 一样合并而非覆盖。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/empty/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
/**
 * `Empty` 的公共类型（T3-05）。
 *
 * 范围按 `docs/04 §4` 的 P0 条目「空状态、自定义插画」：一句话描述 + 一块插画 +
 * 可选的底部操作区，不做表单向导、不做错误码分支。
 *
 * R3 说明：`description` / `image` 都是**节点**而不是渲染函数，所以不套
 * `MaybeAccessor` —— `typeof value === 'function'` 无法区分「要渲染的函数」与
 * 「返回值的 getter」，套了会把 `() => <Icon />` 误判成取值器。
 *
 * R2 说明：`size` 只接受字符串字面量，不暴露 `{ small: {...} }` 这类配置对象。
 */
import type { JSX } from 'solid-js';

/**
 * 尺寸档：只影响插画块尺寸与字号档，不影响文案排版。
 * 与全局口径一致，只有 small / medium / large，不存在 sm / md。
 */
export type EmptySize = 'small' | 'medium' | 'large';

/** `<Empty>` 入参。原生属性照常透传到根节点。 */
export interface EmptyProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
  /**
   * 描述文案。传节点而不是字符串，是因为业务经常要带一个「新建」链接或代码片段。
   * @default '暂无数据'
   */
  description?: JSX.Element;
  /**
   * 自定义插画。给了就整体替换内置图形（不是叠加）。
   * 内置图形带 `aria-hidden`，自定义插画由调用方自己决定是否可读。
   * 显式传 `null` 表示**不要插画**（纯文字空状态）；不传则用内置图形。
   * @default 内置线框插画
   */
  image?: JSX.Element | null;
  /**
   * 尺寸档。
   * @default 'medium'
   */
  size?: EmptySize;
  /**
   * 底部操作区，通常放一个主按钮（例如「新建第一条记录」）。
   * 不传则不渲染该区块，DOM 里不留空壳。
   * @default undefined
   */
  children?: JSX.Element;
  /**
   * 根节点样式；与 `class` 一样合并而非覆盖。
   */
  style?: string;
}
```

## 相关 Demo（完整源码见链接页）

- [基础用法](../demos/empty-basic.md)：默认插画 + 默认文案；三档尺寸按容器宽度选，不改变文案排版。（源文件 `packages/core/src/components/empty/demos/basic.tsx`）
- [自定义插画](../demos/empty-custom-image.md)：image 整体替换内置图形而非叠加；自定义图形默认对读屏可见，装饰性图形请自行加 aria-hidden。（源文件 `packages/core/src/components/empty/demos/custom-image.tsx`）
- [带操作](../demos/empty-with-action.md)：children 落在描述下方，通常放一个主按钮；不传 children 时该区块不渲染。（源文件 `packages/core/src/components/empty/demos/with-action.tsx`）

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
