# 根入口 `solid-craft`

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

`solid-craft` 是 `solid-craft` 的公开子路径，条件导出如下。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft';
```

## API

该子路径不暴露组件 Props。

## 根入口导出清单

- `solid-craft/button` → Button 按钮：触发操作的主控件，支持变体、语义色、尺寸、形状、加载与图标。
- `solid-craft/icon` → Icon 图标：语义色与尺寸统一的图标容器，装饰性图标自动对读屏隐藏。
- `solid-craft/typography` → Typography 排版：Title / Text / Paragraph / Link 的层级、修饰与语义色。
- `solid-craft/space` → Space 间距：水平 / 垂直排列、间距档位、分隔与换行。
- `solid-craft/divider` → Divider 分割线：水平 / 垂直分割，支持虚线与带文字。
- `solid-craft/layout` → Layout 布局：Header / Sider / Content / Footer 页面骨架与可折叠侧边栏。
- `solid-craft/grid` → Grid 栅格：24 栅格 Row / Col、间距、偏移与响应式断点。
- `solid-craft/input` → Input 输入框：单行 / 多行 / 数字输入，前后缀、清除、密码显隐、回车搜索、自动高度、字数统计与步进精度。
- `solid-craft/checkbox` → Checkbox 多选框：单选 / 半选 / 多选框组，支持选项数组、整组禁用、排列方向与全选联动。
- `solid-craft/radio` → Radio 单选框：单选框组与独立单选，支持选项数组、整组尺寸、排列方向与字段值驱动。
- `solid-craft/switch` → Switch 开关：带开关语义的二态控件，支持三档尺寸、受控值与原生键盘切换。
- `solid-craft/app` → App 全局反馈：Message / Notification 的上下文宿主与静态 API，脱离组件树亦可调用，错误提示可被 Form 复用。
- `solid-craft/select` → Select 选择器：单选下拉，支持本地搜索、清除、空态与加载态；键盘与弹层定位由原语承担，SSR 只输出触发器静态骨架。
- `solid-craft/form` → Form 表单：表单引擎与字段壳：受控值、六类校验规则、三种布局、错误滚动与 label 三件套，SSR 输出完整静态骨架。
- `solid-craft/date-picker` → DatePicker 日期选择：单选日期：min / max / disabledDate、自定义格式、中文 locale 与键盘导航；日期运算走 @internationalized/date，SSR 不取当前时间。
- `solid-craft/range-picker` → RangePicker 日期范围：双输入框日期区间：选起点后悬停预览、反向点击自动归一化、键盘两段落点与焦点移交；同日 / 跨月 / 跨年边界与 min·max 约束共用一套日期内核。
- `solid-craft/table` → Table 表格：数据表格：列配置、排序筛选、行选择、客户端 / 服务端分页与空 / 加载态；直接组合 Pagination / Empty / Spin，onChange 一次给出三参完整快照，SSR 输出完整静态骨架。
- `solid-craft/pagination` → Pagination 分页：页码、每页条数、快速跳转三段式；总页数变化时当前页自动收敛不越界，受控与非受控同口径，窄屏换行不横向溢出。
- `solid-craft/empty` → Empty 空状态：插画 + 描述 + 可选操作区；内置插画随主题取 currentColor，image 传 null 可退化为纯文字空状态。
- `solid-craft/skeleton` → Skeleton 骨架屏：text / card / table / button / avatar 五种形状；行块高直接引用正文行高与按钮、表格的尺寸 token，骨架与真实内容同高，切换不抖动。
- `solid-craft/spin` → Spin 加载中：独立转圈与包裹遮罩两种形态；delay 延迟显示避免短请求闪烁，遮罩用 color-mix 适配深浅主题，转圈恒带可读文案。
- `solid-craft/modal` → Modal 对话框：受控打开与外部按钮驱动；异步确认期间防重复提交并拦截 ESC / 遮罩关闭；焦点陷阱与关闭后焦点归还触发元素，SSR 只输出静态骨架。

- `solid-craft/config-provider` → ConfigProvider 全局配置

## 相关规范

> 规范摘录：`docs/02-架构设计.md` → ### 3.2 消费方式


```tsx
// 推荐：按组件引入（tree-shaking 最稳）
import { Button } from 'solid-craft/button';
import 'solid-craft/styles.css';

// 或：根导出
import { Button, Input, Form } from 'solid-craft';
```

CSS 采用**显式引入**，原因：

- 避免 JS 隐式副作用，SSR / Webpack / Rspack / 微前端行为可预测。
- 允许两种粒度：
  - 全量：`import 'solid-craft/styles.css'`（tokens + base + 所有组件）
  - 按需：`import 'solid-craft/styles/base.css'` + `import 'solid-craft/styles/components/button.css'`
- 后续可提供 `unplugin-solid-craft` 自动按需引入 CSS，但不作为 v1 前置条件。

> 注意：CSS 显式引入意味着业务方必须记得加。文档、脚手架模板、lint 提示中都要强调；`examples/*` 作为正确用法基准。
