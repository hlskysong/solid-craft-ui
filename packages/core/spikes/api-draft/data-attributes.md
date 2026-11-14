# `data-*` 口径统一表（T0-03 评审第 4 节共用真源）

> 四个复杂组件的草案共用本表。状态一律 `data-*`，SCSS/CSS 只认 `[data-*]` 选择器；
> 类名只用 `CSS_PREFIX`（`scui-`）派生的静态类名，**不生成 modifier class**（AGENTS.md §3）。

## 全局约定

| 属性 | 取值 | 语义 | 适用组件 |
| --- | --- | --- | --- |
| `data-scui-size` | `small \| medium \| large` | 尺寸，默认 `medium`；禁止 `sm` / `md` | Select / DatePicker / Form / Table / Pagination / Modal / Drawer |
| `data-scui-disabled` | `''`（存在即真） | 禁用态，配合原生 `disabled` / `aria-disabled` | 全部 |
| `data-scui-invalid` | `'true' \| 'false'` | 校验失败；SSR 也输出，避免 hydration 属性差 | Form |
| `data-scui-open` | `''` | 弹层展开 | Select / DatePicker |
| `data-scui-loading` | `''`（存在即真） | 加载态：弹层只显示加载提示、触发器置 `aria-busy="true"`；与 `data-scui-open` 同属「存在即真」口径。Table 复用同一口径，落在滚动容器上 | Select / Table |
| `data-scui-auto-size` | `''`（存在即真） | 自动高度生效中（关闭拖拽手柄，高度由 JS 写内联值） | Input（Textarea） |
| `data-scui-count` | `''`（存在即真） | 字数统计显示中（页脚留位） | Input（Textarea） |
| `data-scui-role` | 见下表 | 结构定位（测试/样式锚点），**不表达状态** | 全部 |
| `data-scui-field` | 字段名 | 字段定位 + 错误滚动目标 | Form |
| `data-scui-layout` | `horizontal \| vertical \| inline` | 表单与字段的布局，Form 根与 Form.Item 同源输出 | Form |
| `data-scui-required` | `''`（存在即真） | 字段声明了 required 规则且必填标记开启；与 `data-scui-invalid` 的「校验结果」语义分开 | Form |
| `data-scui-selected` | `''` | 选中态（列表 / 日历格 / 表格行，存在即真）；Table 落在 `<tr>` 上（T3-03） | Select / DatePicker / Table |
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
| `data-scui-row-count` | 数字字符串 | 全量行数（窗口化与筛选后仍保留，T3-01 起恒为原始 `data.length`） | Table |
| `data-scui-filtered-row-count` | 数字字符串 | 当前视图行数（筛选后）；与 `data-scui-row-count` 成对，未筛选时相等 | Table |
| `data-scui-sort` | `asc \| desc` | 当前列排序方向；落在参与排序的 `<th>` 上（T3-02） | Table |
| `data-scui-sort-key` | 列 key | 排序列标识 | Table |
| `data-scui-density` | `comfortable \| default \| compact` | 单元格内距档：16 / 16、12 / 12（默认）、8 / 8；与 `data-scui-size`（行高档）正交 | Table |
| `data-scui-bordered` | `''`（存在即真） | 外边框与列分隔线开关 | Table |
| `data-scui-align` | `left \| center \| right` | 列水平对齐；表头与正文同源输出，恒有值 | Table |
| `data-scui-row-key` | 行键字符串 | 行定位锚点；`rowKey` 缺省时按行序号兜底，供后续选择 / 展开使用 | Table |
| `data-scui-filtered` | `''`（存在即真） | 当前列有生效的筛选值，落在 `<th>` 上（T3-02） | Table |
| `data-scui-filter-open` | `''`（存在即真） | 当前列的筛选面板处于展开态；SSR 首帧恒不输出（面板初态关闭） | Table |
| `data-scui-server` | `''`（存在即真） | 服务端模式：只把排序 / 筛选参数交给 `onChange`，不本地改数据顺序与行数（T3-02） | Table |
| `data-scui-row-disabled` | `''`（存在即真） | 行选择被禁用：该行控件原生 `disabled`、且不进全选集合；**不改整行文字颜色**（禁用不靠降对比度表达，避免 axe `color-contrast`） | Table（T3-03） |
| `data-scui-page` | 页码字符串 | 页码按钮定位；值与 `aria-current` 同源，测试与样式只认它，避免按文本抓节点（T3-04） | Pagination |
| `data-scui-current` | `''`（存在即真） | 当前页；落在页码按钮上，与 `aria-current="page"` **双通道**（后者给读屏、前者给样式与测试）。不复用 `data-scui-selected`：那表达「被选中」而非「当前位于」，一个属性名只表达一个语义（T3-04） | Pagination |
| `data-scui-variant` | `text \| card \| table \| button \| avatar` | 骨架形状；形状用枚举而不是 `title` / `avatar` 三个布尔，避免拼出头像 + 表格这类不存在的组合（T3-05） | Skeleton |
| `data-scui-active` | `''`（存在即真） | 骨架微光动画开启；`prefers-reduced-motion: reduce` 时动画由 CSS 静止，属性本身仍输出（T3-05） | Skeleton |
| `data-scui-last` | `''`（存在即真） | 骨架段落 / 卡片正文的**末行**，用于收窄到 60%。不用 `:last-child`：Solid 复用节点时位置语义不可靠（T3-05） | Skeleton |
| `data-scui-spinning` | `''`（存在即真） | 包裹模式当前处于加载中，与容器 `aria-busy="true"` 同时出现；延迟未到时两者都不输出（T3-05） | Spin |
| `data-scui-pending` | `''`（存在即真） | 异步确认进行中（`onOk` 返回的 Promise 未 settle，或 `confirmLoading` 受控为真）：确认按钮 loading、取消与关闭按钮 disabled、ESC / 遮罩 / 外部交互全部被原语拦截。不复用 `data-scui-loading`：后者表达「内容还在取」，pending 表达「请求已发出、不能重复发」（T3-07） | Modal |
| `data-scui-side` | `left \| right \| top \| bottom` | 抽屉贴边方向，**恒输出**（默认 `right`）；左右方向用 `width`、上下方向用 `height`，两者归一到同一个 `--scui-drawer-size`。刻意新增属性而不复用：`data-scui-placement` 已被 App / Message 的反馈容器位置占用（六向值）、`data-scui-fixed` 是 Table 固定列方向、`data-scui-direction` 表示书写方向 ltr/rtl、`data-scui-orientation` 表示水平 / 垂直（T3-08） | Drawer |

## `data-scui-role` 取值清单

| 取值 | 组件 | 说明 |
| --- | --- | --- |
| `dialog-trigger` / `dialog-content` / `dialog-body` / `dialog-close` | Dialog | Kobalte 原语封装层 |
| `select-all` / `sort-trigger` / `filter-trigger` | Table | 交互锚点：`sort-trigger` / `filter-trigger` 由 T3-02、`select-all` 由 T3-03 落地，SSR 首帧即输出；radio 模式没有全选语义，零输出 |
| `select-row` | Table | 行选择控件锚点（T3-03）：每行一个，SSR 首帧即输出 |
| `table` / `table-scroll` | Table | 结构锚点；T3-06 起 `table-scroll` 仍是带 `overflow-x: auto` 的横向滚动容器，调用方属性 / `data-scui-*` 全归它，外层另加 `table-root` 承担定位 |
| `table-root` / `table-footer` / `table-empty-row` / `table-loading` | Table | 结构锚点（T3-06）：`table-root` 是最外层定位容器；`table-footer` 包住复用的 `Pagination`，**必须在滚动容器之外**，只在启用分页时输出；`table-empty-row` 是空数据时的跨列占位行（内含 `Empty`），`table-loading` 是加载遮罩（内含 `Spin`），两者互斥且 SSR 按同一条件输出。不启用分页时 footer 零输出，既有表格 DOM 不变 |
| `pagination` / `pagination-page` / `pagination-gap` / `pagination-prev` / `pagination-next` | Pagination | 结构锚点（T3-04）：`pagination` 是 `<nav>` 根，`pagination-gap` 是省略号占位（非按钮、`aria-hidden`），其余都是原生 `<button>` |
| `pagination-size` / `pagination-jump` / `pagination-total` | Pagination | 结构锚点（T3-04）：原生 `<select>` / `<input>` / `<span>`，由 `showSizeChanger` / `showQuickJumper` / `showTotal` 控制是否出现；SSR 按同一条件输出 |
| `filter-dropdown` / `filter-option` | Table | 筛选面板与内置选项锚点（T3-02）；面板初态关闭，SSR 零输出 |
| `empty` / `empty-image` / `empty-description` / `empty-footer` | Empty | 结构锚点（T3-05）：`empty-image` 仅在**有插画**时输出（`image={null}` 表示纯文字空状态，整块缺席）；`empty-footer` 仅在传 `children` 时输出 |
| `skeleton` / `skeleton-wrapper` | Skeleton | 结构锚点（T3-05）：无 `children` 时只有 `skeleton`（独立形态）；有 `children` 时外层是 `skeleton-wrapper`（承载 `aria-busy` 与调用方属性） |
| `skeleton-line` / `skeleton-title` / `skeleton-row` / `skeleton-head` / `skeleton-button` / `skeleton-avatar` | Skeleton | 形状锚点（T3-05）：`skeleton-head` 是表格表头行、`skeleton-row` 是正文行，两者块高一致 |
| `spin` / `spin-container` / `spin-overlay` / `spin-tip` | Spin | 结构锚点（T3-05）：`spin` 是转圈本体（`role="status"`，独立与包裹共用），`spin-container` 是包裹模式外层，`spin-overlay` 只在延迟到点后出现 |
| `modal` / `modal-overlay` / `modal-title` / `modal-body` / `modal-footer` / `modal-close` | Modal | 结构锚点（T3-07）：全部由 `primitives/overlay` 的 Portal 在客户端挂载，**SSR 零输出**；`modal` 是 `role="dialog"` 的内容根节点（承载 `data-scui-size` / `data-scui-pending`），`modal-overlay` 是兄弟级遮罩，`modal-footer` 在 `footer={null}` 时整块缺席，`modal-close` 在 `closable={false}` 时零输出 |
| `modal-page` / `modal-trigger` | Modal（SSR 入口专用） | T3-07 的 `ssr-entry.tsx` 静态骨架锚点，不是组件输出：用来验「两个打开态 Modal 在服务端不抛错、页面容器与触发按钮照常输出」。不写「弹层缺席」的 forbid 判据，那是恒真的假判据（N62） |
| `drawer` / `drawer-overlay` / `drawer-title` / `drawer-body` / `drawer-footer` / `drawer-close` | Drawer | 结构锚点（T3-08）：与 Modal 同构，全部由 `primitives/overlay` 的 Portal 在客户端挂载，**SSR 零输出**；`drawer` 是 `role="dialog"` 的内容根节点（承载 `data-scui-side` / `data-scui-size`），`drawer-footer` 在 `footer` 缺省时为 `null` 时整块缺席（Drawer 没有默认确认按钮），`drawer-close` 在 `closable={false}` 时零输出 |
| `drawer-page` / `drawer-trigger` | Drawer（SSR 入口专用） | T3-08 的 `ssr-entry.tsx` 静态骨架锚点，不是组件输出：验四个方向（含显式 `height`）的打开态 Drawer 在服务端不抛错、页面容器与触发按钮照常输出。同样不写 forbid 假判据 |
| `date-picker` / `date-input` / `calendar` / `month-label` / `weekdays` | DatePicker | 结构锚点 |
| `calendar-popup` / `month-prev` / `month-next` / `date-clear` / `date-today` | DatePicker | 结构锚点（T2-10）：全部只在客户端弹层 / 有值时出现，SSR 只输出 `date-picker` 与 `date-input` |
| `range-picker` / `range-start-input` / `range-end-input` | RangePicker | 结构锚点（T2-11）：三个锚点在 SSR 全部输出（区间是双输入框） |
| `range-popup` / `range-calendar` / `range-summary` / `range-clear` / `range-popup-clear` | RangePicker | 结构锚点（T2-11）：后四者只在客户端弹层内出现，SSR 零输出；`range-clear` 是输入框右侧清除按钮、`range-popup-clear` 是弹层页脚清除。翻月与表头复用 DatePicker 的 `month-prev` / `month-next` / `month-label` / `weekdays` 角色值（同一语义不另起新名） |
| `form` / `form-item` / `field-error` / `form-submit` | Form | 结构锚点 |
| `layout-content` | Layout | 结构锚点（T2-13）：`Content` 渲染成 `<div data-scui-role="layout-content">` 而**不是 `<main>`** —— `main` landmark 只能由页面提供，组件里再渲染一个会让「Layout 嵌进已有 main 的页面」出现两个 main |
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
