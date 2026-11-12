# solid-craft-ui 组件库总览

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`generated/catalog.json` + `packages/core/package.json` + `docs/01~07`；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

SolidJS 企业级中后台组件库 `solid-craft-ui`（主 npm 包 `solid-craft`，兄弟包 `solid-craft-icons` / `solid-craft-tokens`，CSS 前缀 `scui-`）。当前版本 `0.1.0`，公开包 `solid-craft` 共 21 个 exports 子路径、16 个组件页、53 个 Demo。

## 关键约定

- **样式显式引入**：JS 不隐式加载 CSS，需 `import 'solid-craft/styles.css'`，变量统一为 `--scui-*` 前缀。
- **状态由 `data-*` 驱动**：组件不叠加 modifier class，样式按属性选择器命中。
- **双构建 / `"solid"` 条件**：`dist/source/*.jsx` 保留 JSX 供消费方按 SSR / CSR 目标编译，`dist/esm/*.js` 为编译后产物。
- **响应式契约**：Props 可为值或 Accessor，组件内部统一用 `resolveValue()` 读取。
- **无障碍**：语义色按 03 §3.1 的 7 档 WCAG21 对比度在构建期校验，不达标即构建失败。

## 语义色速查

| CSS 变量 | light `$value` | dark `$value` | 分档 |
| --- | --- | --- | --- |
| `--scui-color-text-primary` | `rgba(0, 0, 0, 0.88)` | `rgba(255, 255, 255, 0.85)` | `text` |
| `--scui-color-text-secondary` | `rgba(0, 0, 0, 0.65)` | `rgba(255, 255, 255, 0.65)` | `text` |
| `--scui-color-text-tertiary` | `rgba(0, 0, 0, 0.55)` | `rgba(255, 255, 255, 0.55)` | `text` |
| `--scui-color-text-inverse` | `#ffffff` | `#1f1f1f` | `text` |
| `--scui-color-text-disabled` | `rgba(0, 0, 0, 0.25)` | `rgba(255, 255, 255, 0.25)` | `disabled` |
| `--scui-color-bg-surface` | `#ffffff` | `#1f1f1f` | `background` |
| `--scui-color-border-default` | `#f0f0f0` | `#303030` | `decorative` |
| `--scui-color-border-strong` | `#949494` | `#8a8a8a` | `control` |
| `--scui-color-primary` | `{color.palette.blue.6}` | `{color.palette.blue.6}` | `text` |
| `--scui-color-success` | `{color.palette.green.6}` | `{color.palette.green.6}` | `text` |
| `--scui-color-warning` | `{color.palette.amber.6}` | `{color.palette.amber.6}` | `text` |
| `--scui-color-danger` | `{color.palette.red.6}` | `{color.palette.red.6}` | `text` |
| `--scui-color-focus-ring` | `{color.palette.blue.6}` | `{color.palette.blue.6}` | `control` |

带 `{...}` 的值是 DTCG alias 引用，由 style-dictionary 在构建期解析为 CSS `var(--scui-color-palette-*)`。

## 组件与子路径

| 组件 | 子路径 | 说明 |
| --- | --- | --- |
| [Button 按钮](exports/button.md) | `solid-craft/button` | 触发操作的主控件，支持变体、语义色、尺寸、形状、加载与图标。 |
| [Icon 图标](exports/icon.md) | `solid-craft/icon` | 语义色与尺寸统一的图标容器，装饰性图标自动对读屏隐藏。 |
| [Typography 排版](exports/typography.md) | `solid-craft/typography` | Title / Text / Paragraph / Link 的层级、修饰与语义色。 |
| [Space 间距](exports/space.md) | `solid-craft/space` | 水平 / 垂直排列、间距档位、分隔与换行。 |
| [Divider 分割线](exports/divider.md) | `solid-craft/divider` | 水平 / 垂直分割，支持虚线与带文字。 |
| [Layout 布局](exports/layout.md) | `solid-craft/layout` | Header / Sider / Content / Footer 页面骨架与可折叠侧边栏。 |
| [Grid 栅格](exports/grid.md) | `solid-craft/grid` | 24 栅格 Row / Col、间距、偏移与响应式断点。 |
| [Input 输入框](exports/input.md) | `solid-craft/input` | 单行 / 多行 / 数字输入，前后缀、清除、密码显隐、回车搜索、自动高度、字数统计与步进精度。 |
| [Checkbox 多选框](exports/checkbox.md) | `solid-craft/checkbox` | 单选 / 半选 / 多选框组，支持选项数组、整组禁用、排列方向与全选联动。 |
| [Radio 单选框](exports/radio.md) | `solid-craft/radio` | 单选框组与独立单选，支持选项数组、整组尺寸、排列方向与字段值驱动。 |
| [Switch 开关](exports/switch.md) | `solid-craft/switch` | 带开关语义的二态控件，支持三档尺寸、受控值与原生键盘切换。 |
| [App 全局反馈](exports/app.md) | `solid-craft/app` | Message / Notification 的上下文宿主与静态 API，脱离组件树亦可调用，错误提示可被 Form 复用。 |
| [Select 选择器](exports/select.md) | `solid-craft/select` | 单选下拉，支持本地搜索、清除、空态与加载态；键盘与弹层定位由原语承担，SSR 只输出触发器静态骨架。 |
| [Form 表单](exports/form.md) | `solid-craft/form` | 表单引擎与字段壳：受控值、六类校验规则、三种布局、错误滚动与 label 三件套，SSR 输出完整静态骨架。 |
| [DatePicker 日期选择](exports/date-picker.md) | `solid-craft/date-picker` | 单选日期：min / max / disabledDate、自定义格式、中文 locale 与键盘导航；日期运算走 @internationalized/date，SSR 不取当前时间。 |
| [RangePicker 日期范围](exports/range-picker.md) | `solid-craft/range-picker` | 双输入框日期区间：选起点后悬停预览、反向点击自动归一化、键盘两段落点与焦点移交；同日 / 跨月 / 跨年边界与 min·max 约束共用一套日期内核。 |

- [ConfigProvider 全局配置](exports/config-provider.md) · [样式](exports/styles-css.md) · [按组件样式通配](exports/styles.md) · [package.json](exports/package-json.md)

## 指南与设计

- [设计 Token](design/tokens.md)
- [色彩](design/color.md)
- [布局与间距](design/layout.md)
- [动效](design/motion.md)
- [暗色主题](design/dark.md)
- [密度与方向](design/density.md)
- [快速开始](guides/getting-started.md)
- [SSR 与 Hydration](guides/ssr.md)
- [Vite 消费](guides/vite.md)
- [Webpack 5 消费](guides/webpack.md)
- [Rspack 消费](guides/rspack.md)

## 规范摘录

> 规范摘录：`docs/01-技术选型.md` → ## 1. 背景与约束


| 维度 | 假设 |
| --- | --- |
| 使用场景 | 企业内部中后台：表单、列表、详情、审批、权限、报表入口 |
| 团队 | 3–4 名前端 + 1 名设计/视觉评审（可兼职）+ 0.5 QA/自动化（可调整） |
| 技术栈 | 新项目以 SolidJS 为主；可能并存 Vite / Webpack 5 / Rspack / SolidStart |
| 运行环境 | 桌面端为主，Chrome / Edge 为主；Firefox / Safari best effort；可能运行在微前端容器中 |
| 交付 | 私有 npm registry，内部文档站，长期维护 |
| 非目标 | 不做低代码设计器、不做图表库、不做富文本编辑器内核、不追求覆盖 AntD 全量组件 |

选型优先级：**稳定可维护 > 企业场景匹配 > 无障碍与可测试性 > 开发体验 > 包体积**。

> Ant Design / Semi Design 是 React-only，TDesign 目前没有官方 Solid 版本。用 Web Components 包装会引入 SSR、主题、事件、类型和表单集成问题，因此选择自研 Solid 组件层，而不是二次包装现有库。

---
