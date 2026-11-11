# Form API 草案（S-06 / T0-03 核心）

> 按 `TEMPLATE.md` 9 节填写；**第 9 节结论以 `REVIEW.md` 为唯一真源**（Aming 2026-11-11 已签字）。
> 本草案承载 `docs/07 §6` 第 9 项的「响应式契约（值 / Accessor / getter 注入）评审」。

## 1. 组件定位与范围

| 项 | 内容 |
| --- | --- |
| 组件名 | `ScuiForm` / `ScuiFormItem` / `ScuiInput` / `useFormField`，类名 `scui-form*` / `scui-input*` |
| Phase 0 只验可行性 | 是：Input + 校验 + 错误滚动 + 字段级更新不整表重渲染 |
| 不做的部分 | `Form.List`、`dependencies`、`shouldUpdate`、嵌套路径、Zod/Valibot resolver（docs/04 §5.2 P1） |
| 依赖真源 | 纯 Solid（`createSignal` / `createContext` / `createUniqueId`），零新增依赖 |

## 2. Props 表

| Prop | 类型 | 默认值 | 响应式契约 | 说明 |
| --- | --- | --- | --- | --- |
| `initialValues` | `Record<string, string>` | 必填 | 静态初值 | 键即字段名 |
| `rules` | `Record<string, readonly Validator[]>` | `{}` | 静态 | required / minLength / pattern 可组合 |
| `onFinish` | `(values: Record<string, string>) => void` | — | 回调 | 校验通过 |
| `onFinishFailed` | `(errors: Record<string, string \| undefined>) => void` | — | 回调 | 校验失败 |
| `children` | `JSX.Element` | — | — | Form.Item 树 |
| `name` / `label` | `string` | 必填 | 静态 | Form.Item 定位 |
| `id` / `labelledBy` | `string` | 自动生成 | 静态 | Input 与 label 关联 |

## 3. 响应式契约（评审重点）

- **Form.Item 通过 Context 向子控件注入 getter**：`value` / `error` / `status` 均为 `Accessor<T>`，不是快照值。
- 所有控件实现 `useFormField(name)` 协议；控件不保留重复状态，Form 是唯一数据源。
- **每个字段一个独立 `createSignal`**（含独立 error signal），Form.Item 只订阅自己的字段 ⇒ 改一个字段不触发其它字段的 effect。
- `resolveValue()` 是「值 / Accessor / getter」统一归一入口，来自 `packages/core/src/utils/resolve-value.ts`。
- **R3 = A（2026-11-11 裁决）**：保留 `MaybeAccessor<T>` / `resolveValue()`；新增硬约束「禁止用于 `T` 本身可能为函数类型的 prop」，理由是该工具用 `typeof v === "function"` 判定 accessor，无法区分函数值与 getter。
- 禁止解构 props；派生用 `createMemo`。

## 4. `data-*` 口径

见 `data-attributes.md`。核心：`data-scui-field`（同时用于错误滚动定位）、`data-scui-invalid`（SSR 也输出 `'false'`）、`data-scui-role`。

## 5. A11y

- `<form aria-label>`；label 通过 `for` / `id` 关联，Input 带 `aria-labelledby`。
- 错误：`aria-invalid="true"` + `role="alert"` 错误文案。
- 提交失败自动 `scrollIntoView({block:'center'})` 到首个错误字段并 `focus()`。
- 焦点：`:focus-visible` 2px outline + 2px offset。

## 6. SSR / hydration

- ID 用 `createUniqueId()`；无 `window` / `document` 顶层访问。
- `ssr-smoke.mjs`：S-06 HTML 含 `data-scui-role="form"`、`data-scui-invalid="false"`，双渲确定、0 warning。
- 严格 hydration 走 `smoke:start-real` 链路。

## 7. 事件与受控 / 非受控

- `onInput` 写对应字段 signal；提交时统一 `validate()`，失败不调 `onFinish`。
- `reset()` 恢复初值并清空错误；`values()` 返回全量快照。

## 8. 实证清单

| 验收点 | 证据 | 命令 |
| --- | --- | --- |
| 规则组合 / 失败滚动 / 成功提交 | `spikes/s06-form/s06.test.tsx`（5 例） | `pnpm --filter solid-craft exec vitest run spikes/s06-form` |
| **字段级更新不整表重渲染**（effect 计数） | 同上 `CountedField` | 同上 |
| SSR 无报错 | `spikes/s06-form/ssr.tsx` | `node spikes/shared/ssr-smoke.mjs` |

## 9. 评审结论（Aming 填写）

已由 Aming 于 2026-11-11 在 `REVIEW.md` 第 9 节统一裁决（本项对应结论见该文件）。
本草案不重复记录结论，避免双真源；裁决原话与修改要求以 `REVIEW.md` 为准。
