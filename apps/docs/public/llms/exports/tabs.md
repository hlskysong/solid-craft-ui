# Tabs 标签页（`solid-craft/tabs`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

线型 / 卡片两档走 data-scui-variant；键盘导航、焦点与 tablist 语义全部由 Kobalte 原语承担，组件层零重复实现；content 惰性工厂让懒加载真的推迟节点创建。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/tabs/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/tabs/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/tabs/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/tabs/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/tabs';
```

## API

### TabItem

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `key` | `string` | — | 唯一 key，同时是 Kobalte 的 value / Trigger 与 Content 的关联键。 | 是 |
| `label` | `JSX.Element` | — | 标签头文案。 | 是 |
| `content` | `() => JSX.Element` | — | 面板内容的**惰性工厂**。只有该 panel 首次挂载时才调用；`lazy` 为 true 时 未激活的 panel 不挂载，因此连节点创建都被推迟，而不只是「插进 DOM 后隐藏」。 | 否 |
| `disabled` | `boolean` | — | 禁用该标签；原生 `disabled` 与 `data-scui-disabled` 同时输出。 | 否 |

### TabsProps

继承：`Omit<   JSX.HTMLAttributes<HTMLDivElement>,   'children' \| 'onChange' >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `items` | `TabItem[]` | — | 标签页列表。 | 是 |
| `value` | `string` | — | 受控激活 key；给出时点击只发 `onChange`，DOM 由调用方回弹。 | 否 |
| `defaultValue` | `string` | — | 非受控初始 key；缺省时回落到 `items[0].key`。 | 否 |
| `onChange` | `(value: string) => void` | — | 激活 key 变化；受控与非受控都只走这一个出口。 | 否 |
| `variant` | `TabsVariant` | `'line'` | 样式变体，恒输出为 `data-scui-variant`。 | 否 |
| `lazy` | `boolean` | `true` | 懒加载：`true` 时只挂载激活 panel（Kobalte 默认 presence），切换会卸载旧 panel；`false` 时所有 panel 首帧即挂载，非激活panel 用原生 `hidden` 收起。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/tabs/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
/**
 * `Tabs` 的公共类型（T3-11，§4.2 与 `docs/04 §2.3`「线型/卡片、可编辑、懒加载」）。
 *
 * 冻结面只给四条验收（线型 / 卡片 / 懒加载 / 键盘导航），`docs/01~07` 与
 * `spikes/api-draft/` 对 Tabs **零 API 草案、零 data 属性登记**。因此范围严格按
 * §4.2 收口，不做「可编辑」（`docs/04 §2.3` 的说明列提到但任务验收列没要求）。
 *
 * 键盘 / 焦点 / ARIA 全部由 Kobalte Tabs 原语承担：`docs/02 L563`「Kobalte 负责
 * Dialog / Select / Menu / Tabs / Tooltip 等原语的焦点与键盘；我们负责样式、
 * 语义补充、业务状态」、`L568`「Tabs：aria-controls、aria-selected、方向键」。
 * 组件层不写 `role="tablist"` / `onKeyDown` / `tabIndex`，也不另建第二套焦点状态。
 *
 * 属性口径：
 * - 样式变体**复用** `data-scui-variant`：AGENTS 硬约束 3 把「变体」明文指派给它，
 *   Skeleton 的形状变体与 Tabs 的 line / card 都是「组件视觉变体」这一个语义，
 *   取值按组件枚举扩展，不是同名不同义。刻意不新增 `-type`（硬约束 3 指派给文本
 *   语义）、`-style`（太泛）、`-mode`（语义重复）。
 * - 激活态**复用** `data-scui-current`：与 Pagination「当前页」同为「当前位于」，
 *   和 Kobalte 输出 `aria-selected="true"` 构成双通道。不复用 `data-scui-active`
 *   （Skeleton 微光动画开）、`data-scui-selected`（列表项被选中）——语义不同。
 * - 禁用复用 `data-scui-disabled`（存在即真），与原生 `disabled` 双保险。
 *
 * R3：函数型 prop（`onChange` / `TabItem.content`）直接声明为函数，不用
 * `MaybeAccessor` 包裹。`content` 是**惰性渲染工厂**而非状态回调：只有 panel
 * 真正挂载时才会调用，这是「懒加载」能被单测计数的关键。
 */
import type { JSX } from 'solid-js';

/** 标签页样式变体，默认 `line`。 */
export type TabsVariant = 'line' | 'card';

/** 单个标签页的定义。 */
export interface TabItem {
  /** 唯一 key，同时是 Kobalte 的 value / Trigger 与 Content 的关联键。 */
  key: string;
  /** 标签头文案。 */
  label: JSX.Element;
  /**
   * 面板内容的**惰性工厂**。只有该 panel 首次挂载时才调用；`lazy` 为 true 时
   * 未激活的 panel 不挂载，因此连节点创建都被推迟，而不只是「插进 DOM 后隐藏」。
   */
  content?: () => JSX.Element;
  /** 禁用该标签；原生 `disabled` 与 `data-scui-disabled` 同时输出。 */
  disabled?: boolean;
}

/** `<Tabs>` 入参。原生属性照常透传到根节点。 */
export interface TabsProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  /** 标签页列表。 */
  items: TabItem[];
  /** 受控激活 key；给出时点击只发 `onChange`，DOM 由调用方回弹。 */
  value?: string;
  /** 非受控初始 key；缺省时回落到 `items[0].key`。 */
  defaultValue?: string;
  /** 激活 key 变化；受控与非受控都只走这一个出口。 */
  onChange?: (value: string) => void;
  /**
   * 样式变体，恒输出为 `data-scui-variant`。
   * @default 'line'
   */
  variant?: TabsVariant;
  /**
   * 懒加载：`true` 时只挂载激活 panel（Kobalte 默认 presence），切换会卸载旧
   * panel；`false` 时所有 panel 首帧即挂载，非激活panel 用原生 `hidden` 收起。
   * @default true
   */
  lazy?: boolean;
  /** `tablist` 的无障碍名称；恒输出，避免 axe 的 landmark/控件无名。 @default '标签页' */
  'aria-label'?: string;
}
```

## 相关 Demo（完整源码见链接页）

- [基础用法与键盘导航](../demos/tabs-basic.md)：tablist / tab / tabpanel 与方向键、Home / End、roving tabindex 都由 Kobalte 原语输出；组件只把激活态落成 data-scui-current。禁用项不可聚焦。（源文件 `packages/core/src/components/tabs/demos/basic.tsx`）
- [懒加载开关](../demos/tabs-lazy.md)：lazy 默认 true：未激活 panel 的 content 工厂一次都不调用，切换才创建。lazy=false 时所有 panel 首帧挂载，非激活的用原生 hidden 收起，不重复创建。（源文件 `packages/core/src/components/tabs/demos/lazy.tsx`）
- [线型与卡片](../demos/tabs-variant.md)：两档样式都由 data-scui-variant 表达（AGENTS 硬约束 3 把「变体」指派给该属性），激活态复用 data-scui-current。切换按钮验证属性与样式同步生效。（源文件 `packages/core/src/components/tabs/demos/variant.tsx`）

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
