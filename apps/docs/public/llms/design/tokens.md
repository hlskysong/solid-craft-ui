# 设计 Token

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`apps/docs/src/content/pages.mjs` + `docs/03-设计系统.md` + `packages/tokens/tokens/semantic/*.json`；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

DTCG 三层结构、分档对比度校验与 CSS 变量命名。

关键词：DTCG / token / style-dictionary / colorjs / 对比度 / WCAG。

## 当前语义 Token（构建期校验过的真实值）

| CSS 变量 | 值 | 对比度档位 | 校验背景 | 用途 |
| --- | --- | --- | --- | --- |
| `--scui-color-text-primary` | `rgba(0, 0, 0, 0.88)` | `text` | `color.bg.surface` | 正文主文本 |
| `--scui-color-text-secondary` | `rgba(0, 0, 0, 0.65)` | `text` | `color.bg.surface` | 次要文本 |
| `--scui-color-text-tertiary` | `rgba(0, 0, 0, 0.55)` | `text` | `color.bg.surface` | 辅助文本（v0.2 修正，实测 ≈4.74:1） |
| `--scui-color-text-inverse` | `#ffffff` | `text` | `color.primary` | 实心按钮 / 深色背景上的文本；校验对主色背景的对比度 |
| `--scui-color-text-disabled` | `rgba(0, 0, 0, 0.25)` | `disabled` | `—` | 禁用态文本；按 03 §3.1 豁免对比度，且不得单独承载信息 |
| `--scui-color-bg-surface` | `#ffffff` | `background` | `—` | 亮色主题参照背景 |
| `--scui-color-border-default` | `#f0f0f0` | `decorative` | `—` | 纯装饰性默认边框 / 分割线，不承担控件边界识别 |
| `--scui-color-border-strong` | `#949494` | `control` | `color.bg.surface` | 输入框 / 按钮等可识别控件边界 |
| `--scui-color-primary` | `{color.palette.blue.6}` | `text` | `color.bg.surface` | 主操作 / 选中 / 链接；Button 默认色（ADR-019） |
| `--scui-color-success` | `{color.palette.green.6}` | `text` | `color.bg.surface` | 成功 / 通过 / 在线 |
| `--scui-color-warning` | `{color.palette.amber.6}` | `text` | `color.bg.surface` | 警告 / 待处理 / 风险提示 |
| `--scui-color-danger` | `{color.palette.red.6}` | `text` | `color.bg.surface` | 错误 / 删除 / 失败 / 危险操作 |
| `--scui-color-focus-ring` | `{color.palette.blue.6}` | `control` | `color.bg.surface` | 焦点指示环（WCAG 1.4.11 ≥3:1；03 §11 要求 2px + 2px offset） |

暗色主题由 `theme-dark.css` 覆盖同名变量；当前构建期按 03 §3.1 的 7 档规则校验，语义色漏标 `$contrastTier` 或不达标都会让 `pnpm build` 失败。

## 规范摘录

> 规范摘录：`docs/03-设计系统.md` → ### 2.1 三层结构


| 层级 | 作用 | 示例 | 谁使用 |
| --- | --- | --- | --- |
| Primitive | 原始色阶、尺寸、字体 | `--scui-blue-6`、`--scui-space-4` | 构建期 / 主题生成 |
| Semantic | 语义角色 | `--scui-color-primary`、`--scui-color-text-secondary` | 组件 SCSS、业务覆盖 |
| Component | 组件级微调 | `--scui-button-height`、`--scui-table-row-height` | 组件内部、业务微调 |

规则：

- 组件 SCSS **禁止硬编码颜色/尺寸**，只能引用 Semantic 或 Component 变量。
- Primitive 只允许在 token 生成层和极少数布局计算中使用。
- 业务方优先覆盖 Semantic；需要局部微调时覆盖 Component。
- 所有 token 必须有类型、说明、默认值；新增/重命名走设计系统评审。

## 相关页面

- [快速开始](../guides/getting-started.md)
- [样式子路径](../exports/styles-css.md)
- [SSR 与 Hydration](../guides/ssr.md)
