# Phase 0 Spike 预研产物（S-02 / S-04 / S-05 / S-06）

> `docs/07 §6`：「**Phase 0 只验可行性**；性能、完整视觉矩阵、SSR 完整回归均不在本阶段验收」。
> 本目录是四个高风险 P0 组件的**可行性实证**，不是正式组件实现，也不是 M1 交付物。

## 边界（为什么放在 `packages/core/spikes/`）

| 项 | 结论 |
| --- | --- |
| 不进 `src/` | `vite.config.mjs` / `build-source.mjs` / `collect-sources.mjs` 只扫 `src/`，因此不产出 `dist/esm`、`dist/source`、`dist/types` |
| 不进 npm 包 | `packages/core/package.json#files` 只有 `dist` / `LICENSE` / `llms*`，`spikes/` 不在白名单 |
| 不进 exports / check:slice | `check:slice.mjs` 的权威清单是 `exports` 子路径 + `src/components/` 目录，本目录两者都不沾 |
| 不进 llms / 文档站 / 字体字集 / 16 张视觉基线 | `generate-llms.mjs` 扫 `apps/docs/public`；`demo-list` 读 `catalog.json`（扫 `src/components/*/demos/`）；字体字集扫 `apps/docs/src` —— 全部不受影响 |
| 能自动验收 | `packages/core/vitest.config.mjs` 的 `include` 含 `spikes/**/*.test.{ts,tsx}`，`pnpm test`（verify 第 2 阶段）自动跑；SSR 契约挂在 `scripts/check-ci.mjs`（verify 第 22 阶段） |
| 零新增依赖 | `@kobalte/core` / `@tanstack/solid-table` / `@internationalized/date` / `@floating-ui/dom` 早已在 lockfile |

## 目录与任务映射

| 任务 | 目录 | 验收点 | 客户端实证 | SSR |
| --- | --- | --- | --- | --- |
| S-02 Kobalte 封装（Select + Dialog） | `s02-kobalte/` | 样式覆盖 / 键盘 / 焦点 / SSR 无报错 | `s02.test.tsx` 5 例 | `ssr.tsx` |
| S-04 Table 1 万行 + 固定列方案 | `s04-table/` | 排序 / 选择 / 窗口化 / sticky 方案（60fps 留 Phase 5） | `s04.test.tsx` 7 例 | `ssr.tsx` |
| S-05 DatePicker 基础 | `s05-date-picker/` | 基础 / 禁用 / 键盘 / 中文 locale / hydration 冒烟 | `s05.test.tsx` 7 例 + `hydration.test.tsx` 1 例 | `ssr.tsx` |
| S-06 Form 校验链路 | `s06-form/` | Input + 校验 + 错误滚动 + 字段级更新不整表重渲染 | `s06.test.tsx` 5 例 | `ssr.tsx` |
| 共用 | `shared/ssr-smoke.mjs` | 4 个 Spike 的 SSR 单档渲染（双渲确定性 + data-* + 0 warning） | — | — |
| 共用 | `spikes.css` | `[data-*]` 状态选择器 + `:focus-visible` 2px outline | — | — |
| T0-03 评审材料 | `api-draft/` | 统一模板 / 4 份草案 / data-* 口径 / 待签字清单 | — | — |

## 运行命令

```sh
# shell: sh
pnpm --filter solid-craft exec vitest run spikes          # 24 个客户端实证
node packages/core/spikes/shared/ssr-smoke.mjs            # 4 个 SSR 单档渲染
pnpm verify                                              # 25 阶段（含上述两项，经 check:ci）
```

## 实证边界（不得冒充的结论）

1. **60fps 未验**：Table 只验 1 万行数据与固定列方案，性能验收在 Phase 5。
2. **严格 hydration 未在此重复造 runner**：`ssrLoadModule` 默认 `ssr:false` 产出不带 `data-hk` 的纯 SSR 字符串；S-05 的 `hydrate()` 冒烟走 `done=true` 降级路径，严格链路归 `pnpm smoke:start-real`（真实 SolidStart + `dist/source/*.jsx`）。
3. **Kobalte jsdom 交互限制**：0.13.14 原语在 jsdom 下不响应 click/keydown/pointer* 的选中链路，S-02 封装层自行接管键盘与选中回调；正式实现需在真实浏览器 e2e 补验。
4. **API 草案未评审**：`api-draft/REVIEW.md` 第 9 节与 5 项裁决（R1~R5）均为空，**T0-03 仍 `[ ]`**，评审须 Aming 主持，AI 不得代签。

## 与 M1 范围的关系

方案 C 由 Aming 于 2026-11-10 授权：严格按冻结规范补齐四个 Spike 与 T0-03 评审后再勾 T0-04。
本目录只完成「补齐四个 Spike」这一半；**T0-03 评审结论、T0-04 与 T1-13 的勾选仍待 Aming 签字**，
`docs/08` 的 §30.10 记录完整证据链与欠账。
