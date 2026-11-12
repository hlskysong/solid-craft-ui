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
