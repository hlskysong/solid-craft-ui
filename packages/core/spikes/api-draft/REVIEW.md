# T0-03 API 草案评审清单（**待 Aming 主持**）

> ⚠️ **本文件不是评审结论。** `docs/07 §6` 第 14 项要求「API 草案按统一模板与 `data-*` 口径评审通过」；
> 裁决真源 C09 / C14 明确「评审须 Aming 主持」「设计文档不冒充评审结论」。
> AI 只负责把草案与实证摆齐，**不得代填第 9 节结论，也不得据此勾选 T0-03 / T0-04 / T1-13**。

## 评审材料清单

| 材料 | 路径 | 状态 |
| --- | --- | --- |
| 统一模板（9 节） | `TEMPLATE.md` | 已落盘 |
| `data-*` 口径真源 | `data-attributes.md` | 已落盘 |
| Form / Table / Select / DatePicker 草案 | `Form.md` / `Table.md` / `Select.md` / `DatePicker.md` | 已落盘 |
| 四个 Spike 客户端实证 | `spikes/*/*.test.tsx` | 24 例通过 |
| 四个 Spike SSR 单档渲染 | `spikes/shared/ssr-smoke.mjs` | 4/4 通过 |
| 样式覆盖层 | `spikes/spikes.css` | 已落盘（`[data-*]` + `:focus-visible`） |

## 必须由 Aming 裁决的 5 项

| # | 议题 | 选项 A | 选项 B | 影响 |
| --- | --- | --- | --- | --- |
| R1 | `data-*` 命名空间 | 沿用现有 7 个组件的裸属性（`data-size` 等） | 全量切到 `data-scui-*` | 决定正式实现是否要改既有组件 |
| R2 | Kobalte 受控值 | 对外暴露字符串 `value`（封装层映射 option 对象） | 对外暴露整个 option 对象 | 决定 Select 的公共 API 形态 |
| R3 | 响应式契约 | `MaybeAccessor<T>`（值 / Accessor / getter） | 只许 getter | 决定 `resolveValue()` 是否进入公共 API |
| R4 | Table 虚拟化 | Phase 0 只做固定行高窗口化 | 直接引虚拟滚动库 | 60fps 已在 Phase 5，是否提前 |
| R5 | DatePicker 范围 | 基础单选 + 键盘 + 中文 locale | 提前做 RangePicker | docs/04 §5.4 已把范围选择划到 v1.0 |

## Spike 期间发现的、需在评审时确认的事实

1. **Kobalte 0.13.14 没有 `optionLabel`**，只有 `optionTextValue`（typeahead 用）；受控 `value` 是**整个 option 对象**，`optionValue` 只作用于 hidden `<select>` 提交值。
2. **Kobalte 在 jsdom 下不响应 click / keydown / pointer\* 的选中链路**（真实浏览器才生效）。S-02 封装层因此自行接管 open 键盘切换与选中回调，保留原语的 aria / data-* / 焦点陷阱；正式实现需决定是否在 e2e 真实浏览器里补验。
3. **`ssrLoadModule` 默认生成不带 `data-hk` 的纯 SSR 字符串（S-02 的 Kobalte 复合组件除外，其输出含 `data-hk`）**，与客户端 hydratable 编译不配对；严格 hydration 必须走 `dist/source/*.jsx`（`pnpm smoke:start-real` 已验）。S-05 的 hydrate 冒烟走 `hydrate()` 降级路径，已如实标注，不冒充严格 hydration。
4. **固定列方案**用同一 `<table>` + `position: sticky` + `border-collapse: separate`，动态行高与 60fps 仍留 Phase 5，本 Spike 未做性能结论。

## 评审结论（Aming 填写）

| 项 | 结论 |
| --- | --- |
| 评审人 | （待填） |
| 评审日期 | （待填） |
| 通过 / 驳回 / 附条件通过 | （待填） |
| R1~R5 逐项裁决 | （待填） |
| 修改要求与复查轮次 | （待填） |

> 评审结论落盘后，才可把 `docs/08` 的 T0-03 主行勾 `[x]`、把 C09 / C14 复审、
> 再依「全部 Spike」依赖闭合 T0-04 与 T1-13。当前这三项**均保持 `[ ]`**。
