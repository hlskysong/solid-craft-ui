# Typography 排版（`solid-craft/typography`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

Title / Text / Paragraph / Link 的层级、修饰与语义色。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/typography/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/typography/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/typography/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/typography/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/typography';
```

## API

### TypographyProps

继承：`Omit<   JSX.HTMLAttributes<HTMLSpanElement>,   'color' \| 'ref' >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `tone` | `'primary' \| 'secondary' \| 'tertiary' \| 'disabled' \| 'success' \| 'warning' \| 'danger'` | `undefined` | 语义色；不传时继承父级颜色。 | 否 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 字号。 | 否 |
| `bold` | `boolean` | `false` | 是否加粗。 | 否 |
| `ellipsis` | `boolean` | `false` | 单行溢出省略。 | 否 |
| `code` | `boolean` | `false` | 是否使用等宽代码样式。 | 否 |
| `mark` | `boolean` | `false` | 是否使用标记背景。 | 否 |
| `delete` | `boolean` | `false` | 是否使用删除线。 | 否 |
| `underline` | `boolean` | `false` | 是否使用下划线。 | 否 |
| `class` | `string` | `undefined` | 自定义类名。 | 否 |
| `children` | `JSX.Element` | `undefined` | 文本内容。 | 否 |

### TitleProps

继承：`TypographyProps`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `level` | `1 \| 2 \| 3 \| 4 \| 5` | `1` | 标题层级，决定渲染的 h1~h5。 | 否 |

### LinkProps

继承：`TypographyProps`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `href` | `string` | `undefined` | 链接地址。 | 否 |
| `target` | `string` | `undefined` | 链接打开方式；target 为 _blank 时默认补充安全的 rel。 | 否 |
| `rel` | `string` | `undefined` | 链接关系。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/typography/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
import type { JSX } from 'solid-js';

export interface TypographyProps extends Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'color' | 'ref'
> {
  /**
   * 语义色；不传时继承父级颜色。
   * @default undefined
   */
  tone?: 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'success' | 'warning' | 'danger';
  /**
   * 字号。
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * 是否加粗。
   * @default false
   */
  bold?: boolean;
  /**
   * 单行溢出省略。
   * @default false
   */
  ellipsis?: boolean;
  /**
   * 是否使用等宽代码样式。
   * @default false
   */
  code?: boolean;
  /**
   * 是否使用标记背景。
   * @default false
   */
  mark?: boolean;
  /**
   * 是否使用删除线。
   * @default false
   */
  delete?: boolean;
  /**
   * 是否使用下划线。
   * @default false
   */
  underline?: boolean;
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 文本内容。
   * @default undefined
   */
  children?: JSX.Element;
}

export interface TitleProps extends TypographyProps {
  /**
   * 标题层级，决定渲染的 h1~h5。
   * @default 1
   */
  level?: 1 | 2 | 3 | 4 | 5;
}

export interface LinkProps extends TypographyProps {
  /**
   * 链接地址。
   * @default undefined
   */
  href?: string;
  /**
   * 链接打开方式；target 为 _blank 时默认补充安全的 rel。
   * @default undefined
   */
  target?: string;
  /**
   * 链接关系。
   * @default undefined
   */
  rel?: string;
}
```

## 相关 Demo（完整源码见链接页）

- [基础用法](../demos/typography-basic.md)：标题层级、文本修饰、字号语义色与段落 / 链接。（源文件 `packages/core/src/components/typography/demos/basic.tsx`）
- [超长文本](../demos/typography-ellipsis.md)：窄容器下的单行省略与换行，以及 ellipsis 与普通文本的对比。（源文件 `packages/core/src/components/typography/demos/ellipsis.tsx`）
- [文档排版](../demos/typography-prose.md)：标题、段落、行内修饰与链接组合成一段可读的说明文字。（源文件 `packages/core/src/components/typography/demos/prose.tsx`）

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
