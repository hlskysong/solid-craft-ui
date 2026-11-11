# DatePicker API 草案（S-05）

> 按 `TEMPLATE.md` 9 节填写；**第 9 节结论以 `REVIEW.md` 为唯一真源**（Aming 2026-11-11 已签字）。

## 1. 组件定位与范围

| 项 | 内容 |
| --- | --- |
| 组件名 | `ScuiDatePicker`，类名 `scui-date-picker*` |
| Phase 0 只验可行性 | 是：基础单选 / 禁用 / 键盘 / 中文 locale / hydration 冒烟 |
| 不做的部分 | `showTime`、时区、月份年份快选、快捷选项（docs/04 §5.4 P1/P2） |
| **范围调整（R5 = B，2026-11-11）** | **RangePicker 在 M1 内正式实现**（Aming 主动裁决提前，非「试点强依赖」豁免）；仍需按 `docs/04 §5.4` 单独排期 hover 预览 / 键盘 / 焦点管理与 `editing` 状态机 |
| 依赖真源 | `@internationalized/date@3.12.4` + `Intl`（`DateFormatter`），零新增依赖 |

## 2. Props 表

| Prop | 类型 | 默认值 | 响应式契约 | 说明 |
| --- | --- | --- | --- | --- |
| `value` | `MaybeAccessor<string \| undefined>` | `undefined` | 值 / getter | ISO `YYYY-MM-DD` |
| `onChange` | `(iso: string) => void` | — | 回调 | 选中或输入合法值 |
| `disabledDate` | `(date: CalendarDate) => boolean` | — | 函数 | 禁用判定 |
| `weekStartsOn` | `'mon' \| 'sun'` | `'mon'` | 静态 | 周首日，走 `startOfWeek` 的 locale 口径 |
| `placeholder` | `string` | `'YYYY-MM-DD'` | 静态 | — |
| `label` | `string` | `'日期'` | 静态 | `aria-label` |

## 3. 响应式契约

- `value` 支持 getter，`valueIso` 用 `createMemo`；输入框编辑串用独立 `createSignal`（`editing` 状态机）。
- `focused` 焦点日期独立 signal；网格 `grid` 用 `createMemo` 派生，键盘移动不重算其它状态。
- 禁止解构 props。

## 4. `data-*` 口径

见 `data-attributes.md`。核心：`data-scui-day`（ISO）、`data-scui-outside`、`data-scui-disabled`、`data-scui-selected`、`data-scui-open`、`data-scui-role`、`lang="zh-CN"`。

## 5. A11y

- 输入框 `aria-label`；日历 `role="grid"` + `aria-label`（中文月标题）；格 `role="gridcell"` + `aria-selected` / `aria-disabled` + `tabindex` 漫游。
- 键盘：`Arrow*` ±1 天 / ±7 天，`Home` / `End` 周首周末，`PageUp` / `PageDown` ±1 月，`Enter` 提交，`Escape` 关闭。
- 焦点：`:focus-visible` 2px outline + 2px offset。

## 6. SSR / hydration

- **SSR 安全**：默认锚点是固定常量 `2026-01-01`，绝不调用 `today()` / `Date.now()`。
- `ssr-smoke.mjs`：S-05 HTML 含 `data-scui-role="date-picker"`、`lang="zh-CN"`，双渲确定、0 warning。
- `spikes/s05-date-picker/hydration.test.tsx`：SSR HTML 灌入容器后 `hydrate()` 0 mismatch warning、点击送达。
- ⚠️ 该冒烟走 `hydrate()` 的 `done=true` 降级路径（纯 SSR 字符串无 `data-hk`），**不冒充严格 hydration**；严格链路归 `smoke:start-real`。

## 7. 事件与受控 / 非受控

- 点击格 / 输入合法 ISO 回车触发 `onChange`；禁用格不触发。
- 非法输入失焦后恢复 `value`（`parseInput` 严格 ISO，失败返回 `null`）。

## 8. 实证清单

| 验收点 | 证据 | 命令 |
| --- | --- | --- |
| 中文 locale / 6×7 网格 / 禁用 / 键盘 / 非法输入恢复 | `spikes/s05-date-picker/s05.test.tsx`（7 例） | `pnpm --filter solid-craft exec vitest run spikes/s05-date-picker` |
| hydration 冒烟 | `spikes/s05-date-picker/hydration.test.tsx` | 同上 |
| SSR 锚点稳定 | `spikes/s05-date-picker/ssr.tsx` | `node spikes/shared/ssr-smoke.mjs` |

## 9. 评审结论（Aming 填写）

已由 Aming 于 2026-11-11 在 `REVIEW.md` 第 9 节统一裁决（本项对应结论见该文件）。
本草案不重复记录结论，避免双真源；裁决原话与修改要求以 `REVIEW.md` 为准。
