# 色彩

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`apps/docs/src/content/pages.mjs` + `docs/03-设计系统.md` + `packages/tokens/tokens/semantic/*.json`；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

OKLCH 生成的 6 色相 × 10 级色阶与语义色引用。

关键词：色阶 / palette / primary / OKLCH / 暗色。

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

> 规范摘录：`docs/03-设计系统.md` → ### 3.1 色板


| 语义 | 默认色相 | 用途 |
| --- | --- | --- |
| Primary | Blue | 主操作、选中、链接、聚焦 |
| Neutral | Gray | 文本、背景、边框、禁用 |
| Success | Green | 成功、通过、在线 |
| Warning | Amber | 警告、待处理、风险提示 |
| Danger | Red | 错误、删除、失败、危险操作 |
| Info | Cyan / Blue | 信息提示、进行中 |

> **v0.3 / Q16 已定**：`Button` 的 `color` 默认值为 `primary`（主蓝），不传 `color` 时按上表 Primary 渲染；`neutral` 必须显式传入。与 06 §2.2 / §3 组件模板的 `?? 'primary'` 及 02 §6.1 类型注释一致。视觉克制由 `variant`（默认 `solid`，可退到 `outline` / `text`）与主色按钮出现频次控制，不靠改默认色。

每个色相生成 **10 级色阶**（1 最浅，10 最深），构建期用 `colorjs.io` 在 OKLCH 空间生成，输出 hex 作为稳定运行时值；`color-mix()` 可用于业务侧渐进增强，但不作为 token 的唯一来源。

生成规则：

- 以品牌主色为基准，保持感知亮度均匀；
- 1–3 用于浅背景/边框，4–5 用于 hover/浅色强调，6 为主色，7–8 用于 active/深色，9–10 用于深色文本/暗色背景；
- 构建期校验（**v0.2 修订，按 WCAG 2.1 分档**）：
  - 正文文本对背景 ≥ 4.5:1，大号文本（≥18.66px bold / 24px）≥ 3:1 —— **不达标直接让构建失败**；
  - 仅用于「非必要辅助信息」的 token 单列一档，按 ≥ 3:1 校验并标注用途，**禁止用于正文**；
  - 交互控件的**可识别边界 / 图标 / 焦点指示** ≥ 3:1（WCAG 1.4.11）；纯装饰性分割线与默认边框不参与该判定，但需在 token 说明中标注 `decorative`；真正的控件边界另用 `--scui-color-border-strong`；
  - 禁用态（`text-disabled`）豁免，但不得单独承载信息；
  - 暗色主题单独跑同一套校验。

## 相关页面

- [快速开始](../guides/getting-started.md)
- [样式子路径](../exports/styles-css.md)
- [SSR 与 Hydration](../guides/ssr.md)
