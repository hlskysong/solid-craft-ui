# T0-03 API 草案评审清单（**待 Aming 主持**）

> ⚠️ **本文件不是评审结论。** `docs/07 §6` 第 14 项要求「API 草案按统一模板与 `data-*` 口径评审通过」；
> 裁决真源 C09 / C14 明确「评审须 Aming 主持」「设计文档不冒充评审结论」。
> AI 只负责把草案与实证摆齐，**不得自行裁决、不得代填第 9 节结论，也不得据此勾选 T0-03 / T0-04 / T1-13**。
> 2026-11-11 起第 9 节已由 Aming 给出裁决，AI 仅按原话代笔录入；本声明约束的是「AI 不得自行裁决」，不否定已落盘的本人结论。

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

> ✅ **2026-11-11 已裁决**：R1 = B（并入 CSS 作用域）、R2 = A、R3 = A（含函数类型禁用约束）、
> R4 = Table 暂时 client only 并文档标注、R5 = B（M1 内正式实现）。逐项原话与修改要求见本文第 9 节。

## Spike 期间发现的、需在评审时确认的事实

1. **Kobalte 0.13.14 没有 `optionLabel`**，只有 `optionTextValue`（typeahead 用）；受控 `value` 是**整个 option 对象**，`optionValue` 只作用于 hidden `<select>` 提交值。
2. **Kobalte 在 jsdom 下不响应 click / keydown / pointer\* 的选中链路**（真实浏览器才生效）。S-02 封装层因此自行接管 open 键盘切换与选中回调，保留原语的 aria / data-* / 焦点陷阱；正式实现需决定是否在 e2e 真实浏览器里补验。
3. **`ssrLoadModule` 默认生成不带 `data-hk` 的纯 SSR 字符串（S-02 的 Kobalte 复合组件除外，其输出含 `data-hk`）**，与客户端 hydratable 编译不配对；严格 hydration 必须走 `dist/source/*.jsx`（`pnpm smoke:start-real` 已验）。S-05 的 hydrate 冒烟走 `hydrate()` 降级路径，已如实标注，不冒充严格 hydration。
4. **固定列方案**用同一 `<table>` + `position: sticky` + `border-collapse: separate`，动态行高与 60fps 仍留 Phase 5，本 Spike 未做性能结论。

## 评审结论（Aming 填写）

| 项 | 结论 |
| --- | --- |
| 评审人 | Aming |
| 评审日期 | 2026-11-11 |
| 通过 / 驳回 / 附条件通过 | 附条件通过：R1~R5 逐项裁决见下行，4 条修改要求须在复杂组件正式实现开工前落实并复查一轮 |
| R1~R5 逐项裁决 | **R1 = B**：全量切 `data-scui-*`，并把「CSS 作用域」并入裁决（样式选择器一律带 `.scui-` 静态类作用域）；裸属性的防污染动机成立。**R2 = A**：Select 对外暴露字符串 `value`，封装层映射 Kobalte 的 option 对象。**R3 = A**：保留 `MaybeAccessor` 与 `resolveValue`，并加「函数类型禁用约束」硬约束。**R4**：Table 组件暂时 client only，在文档里标出来，工程成本因此可接受。**R5 = B**：RangePicker 在 M1 内正式实现。 |
| 修改要求与复查轮次 | ① R1 切换现有 32 种裸属性与约 103 处 CSS 选择器，并加 `.scui-` 作用域；`data-testid` 与 Solid 的 `data-hk` 不切。② R3 在 `resolve-value.ts` 写明「禁止用于函数类型的 prop」。③ R4 在 `Table.md` 标注 client-only 边界。④ R5 在 `DatePicker.md` 标注 M1 范围调整。复查轮次：复杂组件正式实现开工前 1 轮，记录进 §30.11。 |

> 评审结论已于 2026-11-11 落盘；据此把 `docs/08` 的 T0-03 主行勾 `[x]`、复审 C09 / C14、
> 再依「全部 Spike」依赖闭合 T0-04 与 T1-13。三项勾选与复审记录见 `docs/08 §30.11`。
