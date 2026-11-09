# 布局与间距

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`apps/docs/src/content/pages.mjs` + `docs/03-设计系统.md` + `packages/tokens/tokens/semantic/*.json`；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

8px 基准间距、24 栅格与响应式断点。

关键词：spacing / grid / 断点 / 响应式。

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

> 规范摘录：`docs/03-设计系统.md` → ### 5.1 间距


4px 基准：

| Token | 值 | 用途 |
| --- | --- | --- |
| `--scui-space-0` | 0 | — |
| `--scui-space-1` | 2px | 紧凑内联 |
| `--scui-space-2` | 4px | 图标与文本 |
| `--scui-space-3` | 6px | 小间距 |
| `--scui-space-4` | 8px | 控件内边距 |
| `--scui-space-5` | 12px | 表单项内 |
| `--scui-space-6` | 16px | 卡片内边距、栅格 gutter |
| `--scui-space-7` | 20px | 区块间距 |
| `--scui-space-8` | 24px | 卡片 padding、页面区块 |
| `--scui-space-9` | 32px | 大区块 |
| `--scui-space-10` | 40px | 页面级 |
| `--scui-space-11` | 48px | 页面级 |
| `--scui-space-12` | 64px | 空状态 / 结果页 |

语义别名（括号为 **px 值**，不是 `--scui-space-N` 的编号，v0.2 明确）：`--scui-space-xs` = `--scui-space-2`(4px)、`sm` = `--scui-space-4`(8px)、`md` = `--scui-space-5`(12px)、`lg` = `--scui-space-6`(16px)、`xl` = `--scui-space-8`(24px)、`2xl` = `--scui-space-9`(32px)。

标称「4px 基准」，`--scui-space-1`(2px) 与 `--scui-space-3`(6px) 是允许的半步例外，仅用于图标与文本微调；组件内边距优先用 4 的倍数。

## 相关页面

- [快速开始](../guides/getting-started.md)
- [样式子路径](../exports/styles-css.md)
- [SSR 与 Hydration](../guides/ssr.md)
