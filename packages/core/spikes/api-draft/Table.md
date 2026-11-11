# Table API 草案（S-04）

> 按 `TEMPLATE.md` 9 节填写；**第 9 节留空待 Aming 评审**。

## 1. 组件定位与范围

| 项 | 内容 |
| --- | --- |
| 组件名 | `ScuiTable`，类名 `scui-table*` |
| Phase 0 只验可行性 | 是：1 万行数据 + 排序 / 选择 + 固定列**方案** |
| 不做的部分 | 60fps 性能验收（Phase 5）、动态行高虚拟滚动、分组表头、树形、列宽拖拽、ProTable |
| 依赖真源 | 纯 Solid 实现 + `@tanstack/solid-table@9.3.1`（已在 lockfile，本 Spike 未强依赖） |

## 2. Props 表

| Prop | 类型 | 默认值 | 响应式契约 | 说明 |
| --- | --- | --- | --- | --- |
| `rows` | `MaybeAccessor<readonly TableRow[]>` | 必填 | 值 / getter | 全量数据 |
| `sort` | `MaybeAccessor<SortState \| undefined>` | `undefined` | 值 / getter | 受控排序 |
| `onSortChange` | `(sort: SortState) => void` | — | 回调 | 三态循环 asc → desc → 默认 |
| `selected` | `MaybeAccessor<ReadonlySet<number>>` | 空集合 | 值 / getter | 不可变 Set |
| `onSelectionChange` | `(next: ReadonlySet<number>) => void` | — | 回调 | 单选 / 全选 |
| `windowSize` | `number` | `20` | 静态 | 固定行高窗口化的可见行数 |

## 3. 响应式契约

- `resolveValue()` 归一 `rows` / `sort` / `selected`；`ordered` / `visible` 用 `createMemo`。
- 数据层 `table-engine.ts` 是纯函数真源，视图层只转发，不复制算法。
- 字段级思路同样适用：`visible()` 只依赖排序结果与窗口大小，改选中态不重排 1 万行。

## 4. `data-*` 口径

见 `data-attributes.md`。核心：`data-scui-fixed="left|right"`、`data-scui-row-count`、`data-scui-selected`、`data-scui-sort`、`data-scui-sort-key`、`data-scui-role`。

## 5. A11y

- 原生 `<table>` / `<thead>` / `<tbody>` / `<th>` / `<tr>` / `<td>` 语义。
- 排序列 `<button>` 可键盘触发；全选 / 行选 checkbox 有 `aria-label`。
- 焦点：`:focus-visible` 2px outline + 2px offset。

## 6. SSR / hydration

- 数据生成确定性（`Array.from`，无 `Math.random` / `Date.now`）。
- `ssr-smoke.mjs`：S-04 HTML 含 `data-scui-role="table"`、`data-scui-fixed="left"`，双渲逐字一致、0 warning。
- 严格 hydration 走 `smoke:start-real` 链路。

## 7. 事件与受控 / 非受控

- `onSortChange` / `onSelectionChange` 均为受控回调，组件不持有内部选中副本。
- `toggleRow` / `toggleAll` 返回新 `Set`，避免共享可变状态。

## 8. 实证清单

| 验收点 | 证据 | 命令 |
| --- | --- | --- |
| 1 万行确定性 / 排序 / 选择 | `spikes/s04-table/s04.test.tsx`（7 例） | `pnpm --filter solid-craft exec vitest run spikes/s04-table` |
| 窗口化只渲染 20 行但保留 10000 计数 | 同上 | 同上 |
| 排序 / 选择回调 | 同上 | 同上 |
| SSR 无报错 | `spikes/s04-table/ssr.tsx` | `node spikes/shared/ssr-smoke.mjs` |

## 9. 评审结论（Aming 填写）

（待填：评审人 / 日期 / 结论 / R4 虚拟化口径 / 修改要求）
