# `data-*` 口径统一表（T0-03 评审第 4 节共用真源）

> 四个复杂组件的草案共用本表。状态一律 `data-*`，SCSS/CSS 只认 `[data-*]` 选择器；
> 类名只用 `CSS_PREFIX`（`scui-`）派生的静态类名，**不生成 modifier class**（AGENTS.md §3）。

## 全局约定

| 属性 | 取值 | 语义 | 适用组件 |
| --- | --- | --- | --- |
| `data-scui-size` | `small \| medium \| large` | 尺寸，默认 `medium`；禁止 `sm` / `md` | Select / DatePicker / Form / Table |
| `data-scui-disabled` | `''`（存在即真） | 禁用态，配合原生 `disabled` / `aria-disabled` | 全部 |
| `data-scui-invalid` | `'true' \| 'false'` | 校验失败；SSR 也输出，避免 hydration 属性差 | Form |
| `data-scui-open` | `''` | 弹层展开 | Select / DatePicker |
| `data-scui-role` | 见下表 | 结构定位（测试/样式锚点），**不表达状态** | 全部 |
| `data-scui-field` | 字段名 | 字段定位 + 错误滚动目标 | Form |
| `data-scui-selected` | `''` | 选中态 | Select / DatePicker / Table |
| `data-scui-option` | 选项 value | 选项定位 | Select |
| `data-scui-day` | ISO `YYYY-MM-DD` | 日期格定位 | DatePicker |
| `data-scui-outside` | `''` | 上/下月补位格 | DatePicker |
| `data-scui-fixed` | `left \| right` | 固定列方向（sticky） | Table |
| `data-scui-scrolled` | `''` | 横向滚动阴影开关 | Table |
| `data-scui-row-count` | 数字字符串 | 全量行数（窗口化仍保留） | Table |
| `data-scui-sort` | `asc \| desc` | 当前列排序方向 | Table |
| `data-scui-sort-key` | 列 key | 排序列标识 | Table |

## `data-scui-role` 取值清单

| 取值 | 组件 | 说明 |
| --- | --- | --- |
| `dialog-trigger` / `dialog-content` / `dialog-body` / `dialog-close` | Dialog | Kobalte 原语封装层 |
| `select-all` / `sort-trigger` | Table | 交互锚点 |
| `table` / `table-scroll` | Table | 结构锚点 |
| `date-picker` / `date-input` / `calendar` / `month-label` / `weekdays` | DatePicker | 结构锚点 |
| `form` / `form-item` / `input` / `field-error` / `form-submit` | Form | 结构锚点 |

## 焦点与状态样式

- `[data-*]` 只做状态判断；静态类名只做布局/外观基线。
- `:focus-visible` → `outline: 2px solid var(--scui-focus-ring); outline-offset: 2px;`，禁止裸 `outline: none`。
- 禁用态不靠 class 覆盖：`[data-scui-disabled]` + 原生 `disabled` 双保险。

## 与已发布组件的一致性（2026-11-11 已裁决，不再是待决分歧）

现有 7 个基础组件使用 `data-variant` / `data-size` / `data-color` / `data-loading` 等**裸属性**；
`packages/core/src` 实测 32 种裸属性 / 221 处 / 25 个文件，带 `scui-` 前缀的仅 3 种 / 22 处，属混用状态。

**Aming 于 2026-11-11 裁决 R1 = B**：正式实现时全量切到 `data-scui-*`，并把 **CSS 作用域并入裁决** ——
样式选择器一律带 `.scui-` 静态类作用域。动机是 Kobalte 0.13.14 原语层自身输出无命名空间的
`data-orientation` / `data-type` / `data-disabled` / `data-selected` 等同名属性，裸属性会与业务 DOM 及第三方原语互串。

**例外（不切）**：`data-testid`（测试锚点，行业通用）与 Solid 的 `data-hk`（hydration key，第三方产物）。
B 只保护组件库自有属性，Kobalte 原语层的裸属性改不了，因此必须同时落实 `.scui-` 作用域才算闭环。
本表即统一口径真源；`check:llms` 与视觉基线在正式切换时需同步重生成（见 `docs/08 §30.11` 修改要求 ①）。
