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
| `data-scui-loading` | `''`（存在即真） | 加载态：弹层只显示加载提示、触发器置 `aria-busy="true"`；与 `data-scui-open` 同属「存在即真」口径 | Select |
| `data-scui-auto-size` | `''`（存在即真） | 自动高度生效中（关闭拖拽手柄，高度由 JS 写内联值） | Input（Textarea） |
| `data-scui-count` | `''`（存在即真） | 字数统计显示中（页脚留位） | Input（Textarea） |
| `data-scui-role` | 见下表 | 结构定位（测试/样式锚点），**不表达状态** | 全部 |
| `data-scui-field` | 字段名 | 字段定位 + 错误滚动目标 | Form |
| `data-scui-layout` | `horizontal \| vertical \| inline` | 表单与字段的布局，Form 根与 Form.Item 同源输出 | Form |
| `data-scui-required` | `''`（存在即真） | 字段声明了 required 规则且必填标记开启；与 `data-scui-invalid` 的「校验结果」语义分开 | Form |
| `data-scui-selected` | `''` | 选中态（列表 / 日历格 / 表格行，存在即真） | Select / DatePicker / Table |
| `data-scui-checked` | `'true' \| 'false' \| 'mixed'` | 选择类控件的选中三态；**恒输出**（含 SSR 的 `'false'`），`'mixed'` 只由 `Checkbox.indeterminate` 产生 | Checkbox / Radio / Switch |
| `data-scui-kind` | `info \| success \| warning \| error \| loading` | **一条反馈自身的语义类型**，恒输出；不复用文本 `-tone` 或控件 `-variant`（一个属性名只表达一个语义） | App / Message / Notification |
| `data-scui-placement` | `top \| top-left \| top-right \| bottom \| bottom-left \| bottom-right` | 反馈容器的出现位置；`message` 恒为 `top`，`notification` 可在 `<App>` 上配置 | App / Message / Notification |
| `data-scui-option` | 选项 value | 选项定位 | Select |
| `data-scui-day` | ISO `YYYY-MM-DD` | 日期格定位 | DatePicker / RangePicker |
| `data-scui-outside` | `''` | 上/下月补位格 | DatePicker / RangePicker |
| `data-scui-in-range` | `''`（存在即真） | 日历格落在已选或悬停预览的区间内（含两端） | RangePicker |
| `data-scui-range-start` / `data-scui-range-end` | `''`（存在即真） | 区间端点；**同日选择时两者同时为真**（一个格子既是起点又是终点） | RangePicker |
| `data-scui-picking` | `start \| end` | 下一次落点定义区间的哪一端，恒输出（SSR 也是 `start`），避免客户端首帧属性差 | RangePicker |
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
| `calendar-popup` / `month-prev` / `month-next` / `date-clear` / `date-today` | DatePicker | 结构锚点（T2-10）：全部只在客户端弹层 / 有值时出现，SSR 只输出 `date-picker` 与 `date-input` |
| `range-picker` / `range-start-input` / `range-end-input` | RangePicker | 结构锚点（T2-11）：三个锚点在 SSR 全部输出（区间是双输入框） |
| `range-popup` / `range-calendar` / `range-summary` / `range-clear` / `range-popup-clear` | RangePicker | 结构锚点（T2-11）：后四者只在客户端弹层内出现，SSR 零输出；`range-clear` 是输入框右侧清除按钮、`range-popup-clear` 是弹层页脚清除。翻月与表头复用 DatePicker 的 `month-prev` / `month-next` / `month-label` / `weekdays` 角色值（同一语义不另起新名） |
| `form` / `form-item` / `field-error` / `form-submit` | Form | 结构锚点 |
| `input` / `input-clear` / `input-password-toggle` / `input-search` | Input | 结构锚点（T2-03） |
| `input-number` / `input-number-up` / `input-number-down` | Input（InputNumber） | 结构锚点（T2-04） |
| `textarea` / `textarea-clear` / `textarea-count` | Input（Textarea） | 结构锚点（T2-03） |
| `checkbox` / `checkbox-group` | Checkbox | 结构锚点（T2-05） |
| `radio` / `radio-group` | Radio | 结构锚点（T2-05） |
| `switch` | Switch | 结构锚点（T2-05） |
| `app` / `app-host` / `message-viewport` / `notification-viewport` / `message` / `notification` | App | 结构锚点（T2-06）：`app` 是内联宿主，`app-host` 是脱离树时挂到 body 的全局宿主 |
| `select` / `select-clear` / `select-search` / `select-empty` / `select-loading` | Select | 结构锚点（T2-07）：后三者只在客户端弹层内出现，SSR 不输出；`select` 是内联根节点 |

> **`data-scui-checked` 为何不复用 `data-scui-selected`**（T2-05）：前者表达控件自身状态、
> 有三态且恒输出（SSR 也要出 `'false'`）；后者表达「列表项被选中」、存在即真。
> 合并会让两种 SSR 口径打架，也违反「一个属性名只表达一个语义」。

## 焦点与状态样式

- `[data-*]` 只做状态判断；静态类名只做布局/外观基线。
- `:focus-visible` → `outline: 2px solid var(--scui-focus-ring); outline-offset: 2px;`，禁止裸 `outline: none`。
- 禁用态不靠 class 覆盖：`[data-scui-disabled]` + 原生 `disabled` 双保险。

## 与已发布组件的一致性（2026-11-11 已裁决，不再是待决分歧）

迁移**前**，现有 7 个基础组件使用 `data-variant` / `data-size` / `data-color` / `data-loading` 等**裸属性**；
`packages/core/src` 实测 32 种裸属性 / 221 处 / 25 个文件，带 `scui-` 前缀的仅 3 种 / 22 处，属混用状态。

**Aming 于 2026-11-11 裁决 R1 = B**：正式实现时全量切到 `data-scui-*`，并把 **CSS 作用域并入裁决** ——
样式选择器一律带 `.scui-` 静态类作用域。动机是 Kobalte 0.13.14 原语层自身输出无命名空间的
`data-orientation` / `data-type` / `data-disabled` / `data-selected` 等同名属性，裸属性会与业务 DOM 及第三方原语互串。

**例外（不切）**：`data-testid`（测试锚点，行业通用）与 Solid 的 `data-hk`（hydration key，第三方产物）。
B 只保护组件库自有属性，Kobalte 原语层的裸属性改不了，因此必须同时落实 `.scui-` 作用域才算闭环。
本表即统一口径真源。

## 迁移完成（2026-11-11，§30.11 修改要求 ① 已落实，见 `docs/08 §30.12`）

**R1 = B 已全量落地**：`packages/core/src` 的 **31 种裸属性**（`data-testid` 白名单除外）
共 **205 处** + `tests/e2e/specs/browser.spec.ts` **3 处** = **208 处 / 23 个文件** 已切到
`data-scui-*`；迁移后 src 内 `data-scui-*` 共 33 种 / 227 处，**零裸属性残留**。

**迁移方式**：1:1 改名，不做语义合并。`Divider` 保持 `data-scui-orientation`、`Space` 当时保持
`data-scui-direction`、`ConfigProvider` 根节点也是 `data-scui-direction`（ltr/rtl）——三者
`.scui-` 类作用域不同，CSS 不会互相命中；但消费端若直接写 `[data-scui-direction]` 查询，
语义存在歧义，列为后续可选项，当时的 R1 命名授权边界不覆盖它。

**补充裁决（2026-11-11，紧随 R1 落地）**：上述可选项已执行 —— `Space` 的 `data-scui-direction`
改为 **`data-scui-orientation`**（与 `Divider` 对齐，值域同为 `horizontal` / `vertical`）。
自此 `data-scui-direction` **只表示书写方向**（`ConfigProvider` 的 `ltr` / `rtl`，
与 CSS `direction` 属性同义），消费端写 `[data-scui-direction]` 不再有歧义。
`SpaceProps.direction` **属性名不变**（写法仍是 `<Space direction="vertical">`），仅 DOM 属性改名，
因此对使用方零破坏。改动落在 `Space.tsx` / `space.scss` / `Space.test.tsx`，并在 `Space.test.tsx`
新增「不得复用 `data-scui-direction`」的回归断言，防止后续又合并回去。

**CSS 作用域**：88 个 `[data-*]` 选择器全部经 `:where(.scui-*)` 父块或 `&` 嵌套解析后带类作用域，
由 `check:styles` 第 4 层判据（含 `&` 与 `@media` 嵌套解析）守住，不再靠人肉检查。

**验证**：`pnpm verify` 25 阶段 RC=0；视觉基线 **16/16 零差异**（未重生成基线文件，证明改名对渲染中性）；
`pnpm test` / `pnpm typecheck` RC=0；门禁负向实证 5/5（裸属性 / 去作用域 / 退回旧名 / 产物回流 全部红灯，
`data-testid` 正向对照保持绿）。
