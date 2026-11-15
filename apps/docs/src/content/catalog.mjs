/**
 * 组件目录：文档站导航、路由、搜索索引与生成脚本共用的单点定义。
 *
 * `slug` 必须与 packages/core/src/components/<slug>/demos/ 目录一一对应；
 * scripts/generate-docs.mjs 会双向校验，漏登记或残留目录都会让 `check:docs` 失败。
 */
export const COMPONENTS = [
  {
    slug: 'overview',
    title: '基础组件总览',
    category: '总览',
    description: '当前 MVP 已落地的 8 个基础组件聚合预览。',
    exportPath: null,
    hasApi: false,
  },
  {
    slug: 'button',
    title: 'Button 按钮',
    category: '通用',
    description: '触发操作的主控件，支持变体、语义色、尺寸、形状、加载与图标。',
    exportPath: 'solid-craft/button',
    hasApi: true,
  },
  {
    slug: 'icon',
    title: 'Icon 图标',
    category: '通用',
    description: '语义色与尺寸统一的图标容器，装饰性图标自动对读屏隐藏。',
    exportPath: 'solid-craft/icon',
    hasApi: true,
  },
  {
    slug: 'typography',
    title: 'Typography 排版',
    category: '通用',
    description: 'Title / Text / Paragraph / Link 的层级、修饰与语义色。',
    exportPath: 'solid-craft/typography',
    hasApi: true,
  },
  {
    slug: 'space',
    title: 'Space 间距',
    category: '布局',
    description: '水平 / 垂直排列、间距档位、分隔与换行。',
    exportPath: 'solid-craft/space',
    hasApi: true,
  },
  {
    slug: 'divider',
    title: 'Divider 分割线',
    category: '布局',
    description: '水平 / 垂直分割，支持虚线与带文字。',
    exportPath: 'solid-craft/divider',
    hasApi: true,
  },
  {
    slug: 'layout',
    title: 'Layout 布局',
    category: '布局',
    description: 'Header / Sider / Content / Footer 页面骨架与可折叠侧边栏。',
    exportPath: 'solid-craft/layout',
    hasApi: true,
  },
  {
    slug: 'grid',
    title: 'Grid 栅格',
    category: '布局',
    description: '24 栅格 Row / Col、间距、偏移与响应式断点。',
    exportPath: 'solid-craft/grid',
    hasApi: true,
  },
  {
    slug: 'input',
    title: 'Input 输入框',
    category: '表单',
    description:
      '单行 / 多行 / 数字输入，前后缀、清除、密码显隐、回车搜索、自动高度、字数统计与步进精度。',
    exportPath: 'solid-craft/input',
    hasApi: true,
  },
  {
    slug: 'checkbox',
    title: 'Checkbox 多选框',
    category: '表单',
    description: '单选 / 半选 / 多选框组，支持选项数组、整组禁用、排列方向与全选联动。',
    exportPath: 'solid-craft/checkbox',
    hasApi: true,
  },
  {
    slug: 'radio',
    title: 'Radio 单选框',
    category: '表单',
    description: '单选框组与独立单选，支持选项数组、整组尺寸、排列方向与字段值驱动。',
    exportPath: 'solid-craft/radio',
    hasApi: true,
  },
  {
    slug: 'switch',
    title: 'Switch 开关',
    category: '表单',
    description: '带开关语义的二态控件，支持三档尺寸、受控值与原生键盘切换。',
    exportPath: 'solid-craft/switch',
    hasApi: true,
  },
  {
    slug: 'app',
    title: 'App 全局反馈',
    category: '反馈',
    description: 'Message / Notification 的上下文宿主与静态 API，脱离组件树亦可调用，错误提示可被 Form 复用。',
    exportPath: 'solid-craft/app',
    hasApi: true,
  },
  {
    slug: 'select',
    title: 'Select 选择器',
    category: '表单',
    description: '单选下拉，支持本地搜索、清除、空态与加载态；键盘与弹层定位由原语承担，SSR 只输出触发器静态骨架。',
    exportPath: 'solid-craft/select',
    hasApi: true,
  },
  {
    slug: 'form',
    title: 'Form 表单',
    category: '表单',
    description: '表单引擎与字段壳：受控值、六类校验规则、三种布局、错误滚动与 label 三件套，SSR 输出完整静态骨架。',
    exportPath: 'solid-craft/form',
    hasApi: true,
  },
  {
    slug: 'date-picker',
    title: 'DatePicker 日期选择',
    category: '表单',
    description:
      '单选日期：min / max / disabledDate、自定义格式、中文 locale 与键盘导航；日期运算走 @internationalized/date，SSR 不取当前时间。',
    exportPath: 'solid-craft/date-picker',
    hasApi: true,
  },
  {
    slug: 'range-picker',
    title: 'RangePicker 日期范围',
    category: '表单',
    description:
      '双输入框日期区间：选起点后悬停预览、反向点击自动归一化、键盘两段落点与焦点移交；同日 / 跨月 / 跨年边界与 min·max 约束共用一套日期内核。',
    exportPath: 'solid-craft/range-picker',
    hasApi: true,
  },
  {
    slug: 'table',
    title: 'Table 表格',
    category: '数据',
    description:
      '数据表格：列配置、排序筛选、行选择、客户端 / 服务端分页与空 / 加载态；直接组合 Pagination / Empty / Spin，onChange 一次给出三参完整快照，SSR 输出完整静态骨架。',
    exportPath: 'solid-craft/table',
    hasApi: true,
  },
  {
    slug: 'pagination',
    title: 'Pagination 分页',
    category: '数据',
    description:
      '页码、每页条数、快速跳转三段式；总页数变化时当前页自动收敛不越界，受控与非受控同口径，窄屏换行不横向溢出。',
    exportPath: 'solid-craft/pagination',
    hasApi: true,
  },
  {
    slug: 'empty',
    title: 'Empty 空状态',
    category: '反馈',
    description:
      '插画 + 描述 + 可选操作区；内置插画随主题取 currentColor，image 传 null 可退化为纯文字空状态。',
    exportPath: 'solid-craft/empty',
    hasApi: true,
  },
  {
    slug: 'skeleton',
    title: 'Skeleton 骨架屏',
    category: '反馈',
    description:
      'text / card / table / button / avatar 五种形状；行块高直接引用正文行高与按钮、表格的尺寸 token，骨架与真实内容同高，切换不抖动。',
    exportPath: 'solid-craft/skeleton',
    hasApi: true,
  },
  {
    slug: 'spin',
    title: 'Spin 加载中',
    category: '反馈',
    description:
      '独立转圈与包裹遮罩两种形态；delay 延迟显示避免短请求闪烁，遮罩用 color-mix 适配深浅主题，转圈恒带可读文案。',
    exportPath: 'solid-craft/spin',
    hasApi: true,
  },
  {
    slug: 'modal',
    title: 'Modal 对话框',
    category: '反馈',
    description:
      '受控打开与外部按钮驱动；异步确认期间防重复提交并拦截 ESC / 遮罩关闭；焦点陷阱与关闭后焦点归还触发元素，SSR 只输出静态骨架。',
    exportPath: 'solid-craft/modal',
    hasApi: true,
  },
  {
    slug: 'drawer',
    title: 'Drawer 抽屉',
    category: '反馈',
    description:
      '与 Modal 共用同一份浮层原语；left / right / top / bottom 四方向贴边，三档尺寸与显式宽高按方向归一，焦点陷阱与键盘行为不重复实现，SSR 只输出静态骨架。',
    exportPath: 'solid-craft/drawer',
    hasApi: true,
  },
  {
    slug: 'alert',
    title: 'Alert 警告提示',
    category: '反馈',
    description:
      '页内常驻反馈条：四种语义类型、标题与描述、可关闭、右侧操作区；操作区可直接调用 T2-06 的全局 message 通道，SSR 只输出静态骨架。',
    exportPath: 'solid-craft/alert',
    hasApi: true,
  },
  {
    slug: 'tooltip',
    title: 'Tooltip 文字提示',
    category: '反馈',
    description:
      '锚定浮层：十二向定位与翻转、打开/关闭延迟、可选箭头；ESC 与焦点归还沿用锚定原语，不重复实现第二套契约，SSR 只输出触发按钮。',
    exportPath: 'solid-craft/tooltip',
    hasApi: true,
  },
  {
    slug: 'popconfirm',
    title: 'Popconfirm 气泡确认',
    category: '反馈',
    description:
      '锚定确认气泡：onOk 返回 Promise 期间进入 pending 并拦截全部关闭入口，resolve 后关闭、reject 可重试；与 Modal 共用同一套异步协议。',
    exportPath: 'solid-craft/popconfirm',
    hasApi: true,
  },
  {
    slug: 'card',
    title: 'Card 卡片',
    category: '数据',
    description:
      '标题 / 操作区 / 封面 / 正文四块结构，按内容缺席不留空盒子；加载态复用 data-scui-loading 并直接组合 Skeleton，切换前后不抖动，SSR 全量输出静态骨架。',
    exportPath: 'solid-craft/card',
    hasApi: true,
  },
  {
    slug: 'tag',
    title: 'Tag 标签',
    category: '数据',
    description:
      '五档配色沿用 Button 的 data-scui-color，边框复用存在即真的 data-scui-bordered；可关闭按钮恒带无障碍文案，非受控关闭与 Alert 同口径。',
    exportPath: 'solid-craft/tag',
    hasApi: true,
  },
];

/** 非组件页面的补充 API 表（02 §12.3 的手工补充范围之外，仍由 oxc-parser 生成）。 */
export const EXTRA_APIS = [
  {
    slug: 'config-provider',
    title: 'ConfigProvider 全局配置',
    source: 'src/config-provider/types.ts',
    exportPath: 'solid-craft/config-provider',
  },
];
