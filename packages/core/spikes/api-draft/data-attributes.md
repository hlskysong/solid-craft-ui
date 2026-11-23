# `data-*` 口径统一表（T0-03 评审第 4 节共用真源）

> 四个复杂组件的草案共用本表。状态一律 `data-*`，SCSS/CSS 只认 `[data-*]` 选择器；
> 类名只用 `CSS_PREFIX`（`scui-`）派生的静态类名，**不生成 modifier class**（AGENTS.md §3）。

## 全局约定

| 属性 | 取值 | 语义 | 适用组件 |
| --- | --- | --- | --- |
| `data-scui-size` | `small \| medium \| large` | 尺寸，默认 `medium`；禁止 `sm` / `md` | Select / DatePicker / TimePicker / Form / Table / Pagination / Modal / Drawer |
| `data-scui-time-unit` | `meridiem \| hour \| minute \| second` | 时间面板的列类型（恒输出）；刻意不复用 `data-scui-column`（Descriptions 的「一行几列」语义），同名不同义违反 R1（T4-13） | TimePicker / DatePicker（showTime） |
| `data-scui-index` | `0..n` | 选项在其列中的序号，供方向键定位（T4-13） | TimePicker |
| `data-scui-hour12` / `data-scui-seconds` | `''`（存在即真） | 时间面板使用 12 小时制 / 带秒列（T4-13） | TimePicker / DatePicker（showTime） |
| `data-scui-color` | `primary \| neutral \| success \| warning \| danger` | **控件的配色语义**，恒输出（Button 默认 `primary`、Tag 默认 `neutral`）；与 `demos/shared.tsx` 的 `COLORS` 同口径。AGENTS.md 硬约束 3 早就把「颜色」指派给 `-color`，Button 自 T1 起一直在输出，本行是 T3-10 补齐的**登记表缺漏**（此前只写在代码里）。刻意不复用 `data-scui-kind`（反馈语义类型，取值含 `info` / `loading`）或 `data-scui-variant`（Skeleton 骨架形状）——同名不同义违反 R1（T3-10） | Button / Tag |
| `data-scui-disabled` | `''`（存在即真） | 禁用态，配合原生 `disabled` / `aria-disabled` | 全部 |
| `data-scui-invalid` | `'true' \| 'false'` | 校验失败；SSR 也输出，避免 hydration 属性差 | Form |
| `data-scui-open` | `''` | 弹层展开 | Select / DatePicker / TimePicker |
| `data-scui-loading` | `''`（存在即真） | 加载态：弹层只显示加载提示、触发器置 `aria-busy="true"`；与 `data-scui-open` 同属「存在即真」口径。Table 复用同一口径，落在滚动容器上；Card 同样复用（T3-10），落在卡片根节点上，正文换成组合进来的 `Skeleton`，不自建第二套骨架 | Select / Table / Card |
| `data-scui-auto-size` | `''`（存在即真） | 自动高度生效中（关闭拖拽手柄，高度由 JS 写内联值） | Input（Textarea） |
| `data-scui-count` | `''`（存在即真） | 字数统计显示中（页脚留位） | Input（Textarea） |
| `data-scui-role` | 见下表 | 结构定位（测试/样式锚点），**不表达状态** | 全部 |
| `data-scui-field` | 字段名 | 字段定位 + 错误滚动目标 | Form |
| `data-scui-layout` | `horizontal \| vertical \| inline` | 表单与字段的布局，Form 根与 Form.Item 同源输出 | Form |
| `data-scui-required` | `''`（存在即真） | 字段声明了 required 规则且必填标记开启；与 `data-scui-invalid` 的「校验结果」语义分开 | Form |
| `data-scui-selected` | `''` | 选中态（列表 / 日历格 / 表格行，存在即真）；Table 落在 `<tr>` 上（T3-03） | Select / DatePicker / Table |
| `data-scui-checked` | `'true' \| 'false' \| 'mixed'` | 选择类控件的选中三态；**恒输出**（含 SSR 的 `'false'`），`'mixed'` 只由 `Checkbox.indeterminate` 产生 | Checkbox / Radio / Switch |
| `data-scui-kind` | `info \| success \| warning \| error \| loading` | **一条反馈自身的语义类型**，恒输出；不复用文本 `-tone` 或控件 `-variant`（一个属性名只表达一个语义）。`Alert` 复用同一属性（取值少 `loading`：它是静态页内提示，没有进行中态），而不是另起 `-type` —— 同一语义不另起新名 | App / Message / Notification / Alert |
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
| `data-scui-bordered` | `''`（存在即真） | 外边框开关；Table 用它同时控制外边框与列分隔线，Tag 复用同一语义只控制自身外边框（T3-10），Descriptions 复用它给每个键值项加框（T3-11）。Tag 的边框恒占 1px、关掉时是透明色，因此开关前后尺寸不变 | Table / Tag / Descriptions |
| `data-scui-align` | `left \| center \| right` | 列水平对齐；表头与正文同源输出，恒有值 | Table |
| `data-scui-row-key` | 行键字符串 | 行定位锚点；`rowKey` 缺省时按行序号兜底，供后续选择 / 展开使用 | Table |
| `data-scui-filtered` | `''`（存在即真） | 当前列有生效的筛选值，落在 `<th>` 上（T3-02） | Table |
| `data-scui-filter-open` | `''`（存在即真） | 当前列的筛选面板处于展开态；SSR 首帧恒不输出（面板初态关闭） | Table |
| `data-scui-server` | `''`（存在即真） | 服务端模式：只把排序 / 筛选参数交给 `onChange`，不本地改数据顺序与行数（T3-02） | Table |
| `data-scui-row-disabled` | `''`（存在即真） | 行选择被禁用：该行控件原生 `disabled`、且不进全选集合；**不改整行文字颜色**（禁用不靠降对比度表达，避免 axe `color-contrast`） | Table（T3-03） |
| `data-scui-page` | 页码字符串 | 页码按钮定位；值与 `aria-current` 同源，测试与样式只认它，避免按文本抓节点（T3-04） | Pagination |
| `data-scui-current` | `''`（存在即真） | 「当前位于」：落在页码按钮 / 激活标签上，与 `aria-current="page"`（Pagination）或 `aria-selected="true"`（Tabs，由 Kobalte 输出）**双通道**。不复用 `data-scui-selected`：那表达「列表项被选中」而非「当前位于」，一个属性名只表达一个语义（T3-04）。Tabs 复用同一语义而不另起 `-active`：后者已被 Skeleton 的微光动画占用（T3-11） | Pagination / Tabs |
| `data-scui-variant` | Skeleton：`text \| card \| table \| button \| avatar`；Tabs：`line \| card`；Tag：`dark \| light \| outline \| light-outline` | **组件的视觉变体**；AGENTS 硬约束 3 把「变体」明文指派给 `-variant`，三个组件只是各自枚举不同，语义仍是同一个。形状用枚举而不是 `title` / `avatar` 三个布尔，避免拼出头像 + 表格这类不存在的组合（T3-05）；Tabs 的线型 / 卡片同理（T3-11）；Tag 的形态对齐 TDesign 四档（T4-16）。注意 Tag 的**颜色**不能用本属性（那是 `-color`，同名不同义），见 `-color` 行 | Skeleton / Tabs / Tag |
| `data-scui-active` | `''`（存在即真） | 骨架微光动画开启；`prefers-reduced-motion: reduce` 时动画由 CSS 静止，属性本身仍输出（T3-05） | Skeleton |
| `data-scui-last` | `''`（存在即真） | 骨架段落 / 卡片正文的**末行**，用于收窄到 60%。不用 `:last-child`：Solid 复用节点时位置语义不可靠（T3-05） | Skeleton |
| `data-scui-spinning` | `''`（存在即真） | 包裹模式当前处于加载中，与容器 `aria-busy="true"` 同时出现；延迟未到时两者都不输出（T3-05） | Spin |
| `data-scui-pending` | `''`（存在即真） | 异步确认进行中（`onOk` 返回的 Promise 未 settle，或 `confirmLoading` 受控为真）：确认按钮 loading、取消与关闭按钮 disabled、ESC / 遮罩 / 外部交互全部被原语拦截。不复用 `data-scui-loading`：后者表达「内容还在取」，pending 表达「请求已发出、不能重复发」（T3-07）。`Popconfirm` 复用同一属性与同一套异步协议（T3-09） | Modal / Popconfirm |
| `data-scui-side` | `left \| right \| top \| bottom` | 抽屉贴边方向，**恒输出**（默认 `right`）；左右方向用 `width`、上下方向用 `height`，两者归一到同一个 `--scui-drawer-size`。刻意新增属性而不复用：`data-scui-placement` 已被 App / Message 的反馈容器位置占用（六向值）、`data-scui-fixed` 是 Table 固定列方向、`data-scui-direction` 表示书写方向 ltr/rtl、`data-scui-orientation` 表示水平 / 垂直（T3-08） | Drawer |
| `data-scui-anchor` | `top \| top-start \| top-end \| right \| right-start \| right-end \| bottom \| bottom-start \| bottom-end \| left \| left-start \| left-end` | **锚定浮层挂在触发元素哪一侧**，恒输出（默认 `top`）；与 Floating UI 的 `Placement` 同形，定位 / 翻转由原语负责，CSS 只用它决定 `transform-origin`。刻意新增而不复用：`data-scui-placement` 是反馈容器在屏幕哪个角（六向）、`data-scui-side` 是抽屉贴视口哪条边（四向），三者语义不同（T3-09） | Tooltip / Popconfirm |
| `data-scui-column` | `1 \| 2 \| 3` | **详情列表一行几列**，恒输出（默认 `2`）；与 `data-scui-span` 成对，由 CSS 派生 `--scui-descriptions-columns`。刻意新增而不复用 `data-scui-layout`：后者是 Form 的 `horizontal / vertical / inline` 布局，同名不同义违反 R1；AGENTS 硬约束 3 也没把「列数」指派给任何名字（T3-11） | Descriptions |
| `data-scui-span` | `1 \| 2 \| 3` | **一个键值项跨几列**，恒输出（默认 `1`，SSR 与首帧一致）；AGENTS 硬约束 3 本就把 `-span` 指派给栅格布局，登记表此前漏登记，本轮补齐（同 T3-10 对 `-color` 的处理）。窄屏由 CSS 强制回落到 `1`，避免 `span 2` 在单列容器里造出隐式第二列而横向溢出（T3-11） | Descriptions |
| `data-scui-status` | `ready \| uploading \| done \| error` | **单个文件的上传状态**，落在列表项上且恒输出（SSR 由 `defaultFileList` 给出静态三态）。刻意新增而不复用 `data-scui-state`：后者是原语层专用的 `open / closed` 槽位；也不复用 `-variant`（组件外观变体）或 `-tone`（文本语气），一个属性名只表达一个语义。进度交给原生 `<progress>`，属性只管状态边框色（T3-13） | Upload |
| `data-scui-dragging` | `''`（存在即真） | 拖拽文件悬停在上传区上方；由原生 `dragover` / `dragleave` / `drop` 单点维护，禁用时恒不输出。不用 `-active`：后者已被 Skeleton 的微光动画占用（T3-13） | Upload |

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
| `alert` / `alert-icon` / `alert-body` / `alert-title` / `alert-description` / `alert-action` / `alert-close` | Alert | 结构锚点（T3-09）：内联渲染、SSR 全量输出；`alert-icon` 在 `icon={null}` 时整块缺席，`alert-action` 不传时不渲染，`alert-close` 在 `closable={false}` 时零输出。根节点恒输出 `data-scui-kind` |
| `tooltip` / `tooltip-trigger` / `tooltip-arrow` | Tooltip | 结构锚点（T3-09）：`tooltip` 是 `role="tooltip"` 的内容根节点，与 `tooltip-arrow` 都由 `primitives/anchored` 的 Portal 在客户端挂载、**SSR 零输出**；`tooltip-trigger` 是 SSR 也输出的静态触发按钮，承载 `data-scui-anchor` 的同源方向真源 |
| `popconfirm` / `popconfirm-trigger` / `popconfirm-title` / `popconfirm-description` / `popconfirm-footer` / `popconfirm-arrow` | Popconfirm | 结构锚点（T3-09）：`popconfirm` 是 `role="dialog"` 的内容根节点（承载 `data-scui-anchor` / `data-scui-pending`），与标题 / 描述 / 操作区 / 箭头同由 `primitives/anchored` 的 Portal 在客户端挂载、**SSR 零输出**；`popconfirm-trigger` 是 SSR 静态触发按钮 |
| `alert-page` / `tooltip-page` / `popconfirm-page` | Alert / Tooltip / Popconfirm（SSR 入口专用） | T3-09 三个 `ssr-entry.tsx` 的页面容器锚点，不是组件输出；触发按钮沿用上一行的 `*-trigger` 角色。验打开态 / 四方向 / 异步回调在服务端渲染期不访问 DOM、不抛错。同样不写 forbid 假判据 |
| `card` / `card-cover` / `card-header` / `card-title` / `card-extra` / `card-body` | Card | 结构锚点（T3-10）：内联渲染、**SSR 全量输出**；`card-cover` / `card-header` 按是否传内容整块缺席，`card-title` / `card-extra` 各自独立缺席但共享同一个 `card-header`。加载时 `card-body` 内的子节点换成 `skeleton`（沿用 T3-05 的角色值，不另起 `card-skeleton`）。根节点承载 `data-scui-loading` |
| `tag` / `tag-content` / `tag-close` | Tag | 结构锚点（T3-10）：内联渲染、**SSR 全量输出**；`tag-close` 只在 `closable` 为真时输出且恒带 `aria-label`。根节点恒输出 `data-scui-color`，`data-scui-bordered` 是存在即真的可选项。关闭只改 DOM 不引入新状态属性 |
| `card-page` / `card-trigger` / `tag-page` / `tag-trigger` | Card / Tag（SSR 入口专用） | T3-10 两个 `ssr-entry.tsx` 的页面容器与静态触发按钮锚点，不是组件输出。验三张卡片（含加载态）与五个标签（含边框 / 可关闭）在服务端渲染期不访问 DOM、不抛错。同样不写 forbid 假判据 |
| `tabs` / `tabs-list` / `tabs-tab` / `tabs-panel` | Tabs | 结构锚点（T3-11）：`tabs-list` 由 Kobalte 输出 `role="tablist"`、`tabs-tab` 输出 `role="tab"`、`tabs-panel` 输出 `role="tabpanel"`，组件层只挂 `data-scui-role` 与 `data-scui-current`，不重复实现 ARIA。`tabs-panel` 在 `lazy` 为 true 时只挂载激活项 |
| `descriptions` / `descriptions-header` / `descriptions-title` / `descriptions-extra` / `descriptions-list` / `descriptions-item` / `descriptions-label` / `descriptions-content` | Descriptions | 结构锚点（T3-11）：内联渲染、**SSR 全量输出**；`descriptions-list` 是 `<dl>`、`-label` 是 `<dt>`、`-content` 是 `<dd>`，不复用表格语义。`descriptions-header` 按 `title` / `extra` 是否传入整块缺席 |
| `tabs-page` / `tabs-trigger` / `descriptions-page` / `descriptions-trigger` | Tabs / Descriptions（SSR 入口专用） | T3-11 两个 `ssr-entry.tsx` 的页面容器与静态触发按钮锚点，不是组件输出。验线型 / 卡片 / 全量挂载与三档列数 / 跨列 / 边框在服务端渲染期不访问 DOM、不抛错。同样不写 forbid 假判据 |
| `date-picker` / `date-input` / `calendar` / `month-label` / `weekdays` | DatePicker | 结构锚点 |
| `calendar-popup` / `month-prev` / `month-next` / `date-clear` / `date-today` | DatePicker | 结构锚点（T2-10）：全部只在客户端弹层 / 有值时出现，SSR 只输出 `date-picker` 与 `date-input` |
| `range-picker` / `range-start-input` / `range-end-input` | RangePicker | 结构锚点（T2-11）：三个锚点在 SSR 全部输出（区间是双输入框） |
| `time-picker` / `time-input` / `time-clear` / `time-popup` / `time-panel` / `time-column` / `time-option` / `time-ok` | TimePicker / DatePicker（showTime） | 结构锚点（T4-13）：SSR 只输出 `time-picker` 与 `time-input`（有值时另有 `time-clear`），面板与按钮只在客户端弹层出现；DatePicker 的 `showTime` 复用 `time-panel` / `time-column` / `time-option`，不另造角色名 |
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
| `upload` / `upload-input` / `upload-trigger` / `upload-list` / `upload-item` / `upload-name` / `upload-size` / `upload-progress` / `upload-error` / `upload-cancel` / `upload-retry` / `upload-remove` | Upload | 结构锚点（T3-13）：**内联渲染、SSR 全量输出**；`upload-input` 是 hidden 原生 `<input type="file">`、`upload-trigger` 是承载 `Form.Item` 的 `label[for]` 目标按钮；`upload-progress` / `upload-cancel` 只在 `uploading` 项出现，`upload-error` / `upload-retry` 只在 `error` 项出现，其余按内容缺席。`upload-item` 恒输出 `data-scui-status` |

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
