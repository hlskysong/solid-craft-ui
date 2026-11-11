# Select / Dialog API 草案（S-02）

> 按 `TEMPLATE.md` 9 节填写；**第 9 节结论以 `REVIEW.md` 为唯一真源**（Aming 2026-11-11 已签字）。

## 1. 组件定位与范围

| 项 | 内容 |
| --- | --- |
| 组件名 | `ScuiSelect` / `ScuiDialog`，类名 `scui-select*` / `scui-dialog*` |
| Phase 0 只验可行性 | 是：样式覆盖、键盘、焦点、`renderToString` 无报错 |
| 不做的部分 | 多选、远程搜索、虚拟滚动、分组、Cascader/TreeSelect（docs/04 §5.3 P1/P2） |
| 依赖真源 | `@kobalte/core@0.13.14`（已在 lockfile），零新增依赖 |

## 2. Props 表

| Prop | 类型 | 默认值 | 响应式契约 | 说明 |
| --- | --- | --- | --- | --- |
| `options` | `MaybeAccessor<readonly SelectOption[]>` | 必填 | 值 / Accessor / getter | `createMemo` 归一 |
| `value` | `MaybeAccessor<string \| undefined>` | `undefined` | 值 / getter | 业务字符串，封装层映射到 option 对象 |
| `onChange` | `(value: string) => void` | — | 回调 | 选中或清空 |
| `disabled` | `MaybeAccessor<boolean>` | `false` | 值 / getter | 同时输出 `data-scui-disabled` |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 静态 | 唯一尺寸口径 |
| `placeholder` | `string` | `'请选择'` | 静态 | — |
| `aria-label` | `string` | `'请选择'` | 静态 | — |

`ScuiDialog`：`trigger` / `title` 为 `MaybeAccessor<string>`，`defaultOpen`、`onOpenChange`、`children`。
**禁止解构 props**；组件内一律 `splitProps` + `props.xxx` / `createMemo`。

## 3. 响应式契约

- `resolveValue()` 来自 `packages/core/src/utils/resolve-value.ts`，Spike 直接复用而非复制。
- `options` / `value` / `disabled` 支持 getter；封装层 `createMemo` 派生 `selected`。
- 受控值缺失时用内部 `createSignal` 兜底；`open` 由封装层受控并传给 Kobalte。

## 4. `data-*` 口径

见 `data-attributes.md`。核心：`data-scui-size`、`data-scui-disabled`、`data-scui-open`、`data-scui-option`、`data-scui-role`。
Kobalte 自身输出 `data-expanded` / `data-closed` / `aria-expanded` / `role="listbox"`，作为原语层状态保留，不与 `scui-*` 混用。

## 5. A11y

- Trigger：`aria-haspopup="listbox"` / `aria-expanded`；Dialog trigger：`aria-haspopup="dialog"`。
- 选项：`role="option"` + `aria-selected` + `aria-disabled`；Dialog：`role="dialog"` + 标题 / 描述关联 + 焦点陷阱。
- 键盘：`ArrowDown` / `ArrowUp` / `Enter` / `Space` 展开，`Enter` / `Space` 提交选项，`Escape` 关闭。
- 焦点：`:focus-visible` 2px outline + 2px offset；打开后焦点收进 listbox（`data-highlighted` 首项）。

## 6. SSR / hydration

- 顶层无 `window` / `document`；ID 由 Kobalte `createUniqueId()` 生成。
- `spikes/shared/ssr-smoke.mjs`：S-02 HTML 含 `data-hk`（Kobalte hydratable 原语）、`data-scui-size`、`aria-haspopup="listbox"`，双渲确定、0 warning。
- 严格 hydration 由 `smoke:start-real` 链路验收；本 Spike 不另造 runner。

## 7. 事件与受控 / 非受控

- 选中触发 `onChange(value)`；禁用项与重复值不触发（`value === currentValue()` 去重）。
- **R2 = A（2026-11-11 裁决）**：对外只暴露字符串 `value` / `onChange(value)`，封装层用 `selected()` memo 映射 Kobalte 的 option 对象；公共 API 不泄漏第三方数据结构。
- 外部传 `value` 时以外部为准，回调仍发出，由业务决定是否更新。

## 8. 实证清单

| 验收点 | 证据 | 命令 |
| --- | --- | --- |
| data-* / A11y / getter / disabled | `spikes/s02-kobalte/s02.test.tsx`（5 例） | `pnpm --filter solid-craft exec vitest run spikes/s02-kobalte` |
| 键盘展开 → Enter 选中 → Esc 关闭、焦点陷阱 | 同上 | 同上 |
| Dialog 弹出 / 关闭 | 同上 | 同上 |
| SSR 无报错 | `spikes/s02-kobalte/ssr.tsx` | `node spikes/shared/ssr-smoke.mjs` |

## 9. 评审结论（Aming 填写）

已由 Aming 于 2026-11-11 在 `REVIEW.md` 第 9 节统一裁决（本项对应结论见该文件）。
本草案不重复记录结论，避免双真源；裁决原话与修改要求以 `REVIEW.md` 为准。
