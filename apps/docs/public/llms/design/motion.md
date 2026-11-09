# 动效

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`apps/docs/src/content/pages.mjs` + `docs/03-设计系统.md` + `packages/tokens/tokens/semantic/*.json`；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

时长 / 缓动 token 与 reduced-motion 约定。

关键词：duration / ease / transition / animation。

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

> 规范摘录：`docs/03-设计系统.md` → ## 6. 动效


| Token | 值 | 用途 |
| --- | --- | --- |
| `--scui-motion-duration-fast` | 100ms | hover、颜色变化 |
| `--scui-motion-duration-base` | 150ms | 展开、淡入 |
| `--scui-motion-duration-slow` | 200ms | Modal / Drawer |
| `--scui-motion-ease` | `cubic-bezier(0.2, 0, 0, 1)` | 默认 |
| `--scui-motion-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | 进入 |

原则：

- 动效用于表达状态变化，不用于装饰。
- 表格排序、筛选、分页不做大幅动画。
- `prefers-reduced-motion: reduce` 时全部降为 0ms，仅保留必要的透明度变化。
- 不使用 JS 动画库；CSS transition / animation 足够。

---

## 相关页面

- [快速开始](../guides/getting-started.md)
- [样式子路径](../exports/styles-css.md)
- [SSR 与 Hydration](../guides/ssr.md)
