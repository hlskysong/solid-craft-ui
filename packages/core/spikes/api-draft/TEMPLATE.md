# API 草案统一模板（T0-03 评审用）

> 本模板是 `docs/07 §6` 第 14 项「API 草案按统一模板与 `data-*` 口径评审通过」的落盘物。
> **四个组件草案必须逐份覆盖下列 9 节，缺节即评审不通过。**
> ⚠️ 本文件是**待评审草案**，不是评审结论；结论须由 Aming 本人给出（见 `REVIEW.md`）。

## 1. 组件定位与范围

| 项 | 内容 |
| --- | --- |
| 组件名（正式名派生） | `ScuiXxx` / 类名 `scui-xxx` |
| Phase 0 只验可行性 | 是 / 否，写明不做的部分 |
| 不进 MVP / v1.0 的能力 | 逐条列出 |
| 依赖真源 | 已有依赖 + 版本，禁止新增依赖 |

## 2. Props 表

| Prop | 类型 | 默认值 | 响应式契约 | 说明 |
| --- | --- | --- | --- | --- |
| … | `MaybeAccessor<T>` 或 `T` | `@default` | 值 / Accessor / getter | … |

必须声明：① 是否允许 getter 注入；② 派生状态用 `createMemo`；③ **禁止解构 props**（AGENTS.md §2）。

## 3. 响应式契约（`resolveValue()`）

- 值 / Accessor / getter 三种注入统一由 `packages/core/src/utils/resolve-value.ts` 归一。
- Form.Item 向子控件注入 `value` / `status` / `error` 的 **getter**，不得传快照值。
- 字段级更新不整表重渲染：每个字段独立 signal，实证方式见对应 `*.test.tsx`。

## 4. `data-*` 口径

| 属性 | 取值 | 语义 | 样式挂钩 |
| --- | --- | --- | --- |
| … | … | … | `[data-*]` 选择器 |

- 变体 / 尺寸 / 状态一律 `data-*`；**禁止 `scui-xxx--sm` 之类 modifier class**。
- 尺寸唯一口径 `small | medium | large`，默认 `medium`。
- 与全局口径表的映射见 `data-attributes.md`。

## 5. A11y

- 角色 / `aria-*`：逐条列出。
- 焦点：`:focus-visible` = `2px outline + 2px offset`，禁止裸 `outline: none`。
- 键盘：逐键列出行为。
- 错误：`aria-invalid` / `aria-describedby` / `role="alert"`。

## 6. SSR / hydration

- 模块顶层禁止 `window` / `document`；ID 用 `createUniqueId()`，禁止随机数与 `Date.now()` 默认值。
- `renderToString` 单档渲染可行性：由 `spikes/shared/ssr-smoke.mjs` 验（双渲确定性 + 0 warning）。
- 严格 hydration（data-hk 复用）：属 `smoke:start-real` 的真实框架链路，Phase 0 不重复造 runner。

## 7. 事件与受控 / 非受控

- `onChange` / `onFinish` 等回调签名与触发时机。
- 受控值缺失时的内部状态归属，是否允许重复触发。

## 8. 实证清单

| 验收点 | 证据文件 | 命令 |
| --- | --- | --- |
| … | `spikes/<id>/*.test.tsx` | `pnpm --filter solid-craft exec vitest run spikes/<id>` |

## 9. 评审结论（**由 Aming 填写，AI 不得代填**）

| 项 | 结论 |
| --- | --- |
| 评审人 | （待填） |
| 评审日期 | （待填） |
| 通过 / 驳回 / 附条件通过 | （待填） |
| 修改要求 | （待填） |
