# Table API 草案（S-04）

> 按 `TEMPLATE.md` 9 节填写；**第 9 节结论以 `REVIEW.md` 为唯一真源**（Aming 2026-11-11 已签字）。

## 1. 组件定位与范围

| 项 | 内容 |
| --- | --- |
| 组件名 | `ScuiTable`，类名 `scui-table*` |
| Phase 0 只验可行性 | 是：1 万行数据 + 排序 / 选择 + 固定列**方案** |
| 不做的部分 | 60fps 性能验收（Phase 5）、动态行高虚拟滚动（M1 实现期可选启用 `@tanstack/solid-virtual`）、分组表头、树形、列宽拖拽、ProTable |
| 依赖真源 | 纯 Solid 实现 + `@tanstack/solid-table@9.3.1`（已在 lockfile，本 Spike 未强依赖） |
| **渲染边界（R4 裁决，2026-11-11）** | **Table 组件暂时 client only**：交互、DOM 测量、窗口化与虚拟滚动属 client-only 增强层，见 §6 |

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

### client-only 边界（Aming 2026-11-11 裁决 R4，文档标注项）

- **服务端**：仍输出完整语义表格与静态骨架，`renderToString` 不抛 `Client-only API called on the server side`，双渲逐字一致、0 warning（S-04 SSR 冒烟已验）。
- **客户端**：窗口化 / DOM 测量 / `ResizeObserver` / 虚拟滚动在 `onMount` 后接管，属渐进增强。
- **不引入 client-only 副作用**（AGENTS.md §7）：模块顶层零 `window` / `document` 访问，所有测量放进 `onMount`；`docs/01 L296` / `docs/02 L522` 的「组件库必须 SSR 可用」不因本裁决放宽。
- 若按字面把「整组件不参与 SSR」当实现口径，会与上述冻结规范冲突；`docs/01~07` 受 SHA256 基线保护不改，故按「SSR 静态骨架 + client-only 增强层」落地，裁决原话保留在 `REVIEW.md` 第 9 节。
- 引入 `@tanstack/solid-virtual@3.13.53` 的成本实测：消费端 bundle minified 33,639 B / gzip 10,079 B；peer `solid-js ^1.3.0` 与本项目 `^1.9.0` 兼容、MIT、零 peer 冲突。**本轮不新增依赖**，是否启用留 M1 动态行高 / 真实浏览器性能需求出现时决策；`docs/02`「MVP 依赖最小化」原文不改，提前启用须在 `docs/08` 记一条裁决。
- 60fps 性能验收仍在 Phase 5，不在 Phase 0。

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

已由 Aming 于 2026-11-11 在 `REVIEW.md` 第 9 节统一裁决（本项对应结论见该文件）。
本草案不重复记录结论，避免双真源；裁决原话与修改要求以 `REVIEW.md` 为准。
