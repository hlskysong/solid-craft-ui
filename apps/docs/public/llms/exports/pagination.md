# Pagination 分页（`solid-craft/pagination`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

页码、每页条数、快速跳转三段式；总页数变化时当前页自动收敛不越界，受控与非受控同口径，窄屏换行不横向溢出。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/pagination/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/pagination/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/pagination/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/pagination/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/pagination';
```

## API

### PaginationChange

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `current` | `number` | — | 变更后的当前页，恒为 `1 ≤ current ≤ pageCount`。 | 是 |
| `pageSize` | `number` | — | 变更后的每页条数。 | 是 |
| `total` | `number` | — | 总条数（原样回传，便于服务端请求直接拼参数）。 | 是 |

### PaginationItem

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `key` | `string` | — | 稳定标识：`page-3` / `gap-left` / `gap-right`。 | 是 |
| `type` | `'page' \| 'gap'` | — | `page` 是可点击页码，`gap` 是省略号占位。 | 是 |
| `page` | `number` | — | `type === 'page'` 时的页码；`gap` 时无意义。 | 是 |

### PaginationProps

继承：`Omit<   JSX.HTMLAttributes<HTMLElement>,   'children' \| 'onChange' \| 'style' >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `total` | `MaybeAccessor<number>` | `0` | 总条数；`0` 时页码列表只剩第 1 页且上一页 / 下一页全部禁用。 | 否 |
| `current` | `MaybeAccessor<number>` | `undefined（非受控）` | 受控当前页；给了就完全受控，点击只发 `onChange` 不改内部状态。 越界值在渲染时收敛到 `[1, pageCount]`，不会输出越界页码。 | 否 |
| `defaultCurrent` | `MaybeAccessor<number>` | `1` | 非受控初始页码；仅在挂载时读取一次。 | 否 |
| `pageSize` | `MaybeAccessor<number>` | `undefined（非受控）` | 受控每页条数。 | 否 |
| `defaultPageSize` | `MaybeAccessor<number>` | `10` | 非受控初始每页条数；仅在挂载时读取一次。 | 否 |
| `pageSizeOptions` | `MaybeAccessor<PaginationPageSizeOptions>` | `[10, 20, 50, 100]` | 每页条数候选值；`showSizeChanger` 开启时渲染成原生下拉。 | 否 |
| `showSizeChanger` | `MaybeAccessor<boolean>` | `false` | 是否显示每页条数切换器。 | 否 |
| `showQuickJumper` | `MaybeAccessor<boolean>` | `false` | 是否显示快速跳转输入框（Enter 提交，越界收敛）。 | 否 |
| `showTotal` | `(total: number, range: readonly [number, number]) => JSX.Element` | `undefined（不渲染）` | 总数文案渲染函数；返回 `JSX.Element`，由调用方决定语言与排版。 拿到的是区间而不是单个数字，避免调用方自己算 `(current - 1) * pageSize`。 | 否 |
| `disabled` | `MaybeAccessor<boolean>` | `false` | 禁用整个分页：全部控件原生 `disabled`，点击不触发 `onChange`。 | 否 |
| `size` | `PaginationSize` | `'medium'` | 尺寸。 | 否 |
| `onChange` | `PaginationChangeHandler` | `undefined` | 分页变更回调；页码与每页条数共用这一个出口。 | 否 |
| `style` | `string` | — | 根节点样式；与 `class` 一样合并而非覆盖。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/pagination/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
/**
 * `Pagination` 的公共类型（T3-04）。
 *
 * 范围按 `docs/04 §4` 的 P0 能力：页码、每页条数、快速跳转、受控 / 非受控。
 * `docs/04 §5.1` 另有一条约束：Table 的事件是 `onChange({ pagination, filters, sorter })`，
 * 而 **`Pagination` 组件自身仍提供 `onChange`** —— 两者互不覆盖。为此本文件的
 * `PaginationChange` 与 Table 的 `TablePaginationState` 保持**同形**
 * （`current` / `pageSize` / `total`），T3-06 把一次分页变更直接放进
 * `TableChange.pagination` 即可，无需业务侧二次翻译。
 *
 * R3 说明：`current` / `pageSize` / `total` 等都是**值型**，所以用
 * `MaybeAccessor<T>`（支持传值或 getter）；`onChange` / `showTotal` 是函数型，
 * **不加** `MaybeAccessor` —— `typeof value === 'function'` 无法区分「值」与「getter」。
 */
import type { JSX } from 'solid-js';

import type { MaybeAccessor } from '../../utils/resolve-value';

/** 尺寸口径与全局一致：只有 small / medium / large，不存在 sm / md。 */
export type PaginationSize = 'small' | 'medium' | 'large';

/** 每页条数的候选值。 */
export type PaginationPageSizeOptions = readonly number[];

/**
 * 一次分页变更的出参。
 *
 * 三个字段一次性给全，调用方不需要「猜当前 total」或「记上一次的 pageSize」；
 * 与 `TableChange.pagination` 同形，Table 集成时直接透传。
 */
export interface PaginationChange {
  /** 变更后的当前页，恒为 `1 ≤ current ≤ pageCount`。 */
  current: number;
  /** 变更后的每页条数。 */
  pageSize: number;
  /** 总条数（原样回传，便于服务端请求直接拼参数）。 */
  total: number;
}

/** 分页变更回调。 */
export type PaginationChangeHandler = (change: PaginationChange) => void;

/**
 * 页码列表里的一项。
 *
 * 省略号也是列表项：它占位但不接受点击，因此带 `type` 区分，
 * 并给出稳定 `key` 供 `<For>` 做 keyed diff（避免重渲染时整列重建）。
 */
export interface PaginationItem {
  /** 稳定标识：`page-3` / `gap-left` / `gap-right`。 */
  key: string;
  /** `page` 是可点击页码，`gap` 是省略号占位。 */
  type: 'page' | 'gap';
  /** `type === 'page'` 时的页码；`gap` 时无意义。 */
  page: number;
}

/** `Pagination` 的入参。 */
export interface PaginationProps extends Omit<
  JSX.HTMLAttributes<HTMLElement>,
  'children' | 'onChange' | 'style'
> {
  /**
   * 总条数；`0` 时页码列表只剩第 1 页且上一页 / 下一页全部禁用。
   * @default 0
   */
  total?: MaybeAccessor<number>;
  /**
   * 受控当前页；给了就完全受控，点击只发 `onChange` 不改内部状态。
   * 越界值在渲染时收敛到 `[1, pageCount]`，不会输出越界页码。
   * @default undefined（非受控）
   */
  current?: MaybeAccessor<number>;
  /**
   * 非受控初始页码；仅在挂载时读取一次。
   * @default 1
   */
  defaultCurrent?: MaybeAccessor<number>;
  /**
   * 受控每页条数。
   * @default undefined（非受控）
   */
  pageSize?: MaybeAccessor<number>;
  /**
   * 非受控初始每页条数；仅在挂载时读取一次。
   * @default 10
   */
  defaultPageSize?: MaybeAccessor<number>;
  /**
   * 每页条数候选值；`showSizeChanger` 开启时渲染成原生下拉。
   * @default [10, 20, 50, 100]
   */
  pageSizeOptions?: MaybeAccessor<PaginationPageSizeOptions>;
  /**
   * 是否显示每页条数切换器。
   * @default false
   */
  showSizeChanger?: MaybeAccessor<boolean>;
  /**
   * 是否显示快速跳转输入框（Enter 提交，越界收敛）。
   * @default false
   */
  showQuickJumper?: MaybeAccessor<boolean>;
  /**
   * 总数文案渲染函数；返回 `JSX.Element`，由调用方决定语言与排版。
   * 拿到的是区间而不是单个数字，避免调用方自己算 `(current - 1) * pageSize`。
   * @default undefined（不渲染）
   */
  showTotal?: (total: number, range: readonly [number, number]) => JSX.Element;
  /**
   * 禁用整个分页：全部控件原生 `disabled`，点击不触发 `onChange`。
   * @default false
   */
  disabled?: MaybeAccessor<boolean>;
  /**
   * 尺寸。
   * @default 'medium'
   */
  size?: PaginationSize;
  /**
   * 分页变更回调；页码与每页条数共用这一个出口。
   * @default undefined
   */
  onChange?: PaginationChangeHandler;
  /**
   * 可访问名称，落在 `<nav>` 上。
   * @default '分页'
   */
  'aria-label'?: string;
  /**
   * 根节点样式；与 `class` 一样合并而非覆盖。
   */
  style?: string;
}
```

## 相关 Demo（完整源码见链接页）

- [基础用法](../demos/pagination-basic.md)：页码、边界禁用与总数文案；受控示例把 onChange 的 current 回写后再传回去，形成正常翻页闭环。（源文件 `packages/core/src/components/pagination/demos/basic.tsx`）
- [快速跳转](../demos/pagination-quick-jumper.md)：输入页码后按 Enter 提交，越界输入收敛到首末页、非法输入只清空不跳页；末尾一张展示整体禁用。（源文件 `packages/core/src/components/pagination/demos/quick-jumper.tsx`）
- [每页条数](../demos/pagination-size-changer.md)：切换每页条数会让总页数变化，当前页按新总页数自动收敛；候选值可自定义，当前值不在候选里时会补进选项。（源文件 `packages/core/src/components/pagination/demos/size-changer.tsx`）

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
