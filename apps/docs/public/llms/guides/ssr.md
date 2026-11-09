# SSR 与 Hydration

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`docs/01 / 02 / 06` 规范章节 + `examples/solid-start` / `examples/start-real` 真实源码 + 根 `package.json` 脚本；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

MVP 主力场景是 SPA / MPA，但组件库在 SSR 场景必须 `renderToString` + hydrate 正常（ADR-018）。只发布编译后 ESM 会锁死 client-only DOM，因此每个组件子路径都同时提供 `"solid"` 条件源码产物。

## 验收命令（来自根 package.json）

```json
{
  "smoke:ssr": "pnpm --filter solid-craft-example-solid-start bundle && pnpm --filter solid-craft-example-solid-start smoke",
  "smoke:consumers": "pnpm --filter solid-craft-example-vite bundle && pnpm --filter solid-craft-example-webpack bundle && pnpm --filter solid-craft-example-rspack bundle && node scripts/check-consumers.mjs",
  "smoke:tarball": "node scripts/smoke-tarball.mjs",
  "smoke:start-real": "pnpm --filter solid-craft-example-start-real bundle && pnpm --filter solid-craft-example-start-real smoke"
}
```

## 真实 SolidStart 入口（全文）

```tsx
import { generateHydrationScript, renderToString } from 'solid-js/web';
import { App } from './App';

export interface RenderResult {
  html: string;
  hydrationScript: string;
}

/** 服务端渲染入口；产物由 scripts/smoke.mjs 加载。 */
export function render(): RenderResult {
  return {
    html: renderToString(() => <App />),
    // Solid 的 hydrate 依赖 window._$HY；真实框架由宿主框架注入这段脚本。
    hydrationScript: generateHydrationScript({}),
  };
}
```

## 规范摘录：条件导出

> 规范摘录：`docs/02-架构设计.md` → ### 3.3 `solid` 条件导出


Kobalte 的做法是同时提供编译后 JS 与保留 JSX 的 `.jsx`，通过 `"solid"` condition 让消费方编译器选择。**v0.2 确认这不是可选优化，而是 SSR 的必要条件；v0.3 依据 Q17 决策把它提前到 MVP。**

vite-plugin-solid 官方说明：Solid 的 JSX 在构建期按目标编译（客户端 DOM / 服务端 SSR / 可 hydrate），**只发布编译后 JS 等于锁死目标**，产物是 client-only DOM，服务端渲染会抛 `Client-only API called on the server side`，且无法 hydrate。官方建议发布 `{ "solid": "./dist/source/*.jsx", "import": "./dist/*.js" }` 双入口，由消费方按目标重新编译；每个子路径导出都要有对应的 `solid` 条目。

| 阶段 | 产物 | SSR 能力 |
| --- | --- | --- |
| **MVP（v0.1，v0.3 修订）** | `dist/esm` 编译产物 + `dist/source/*.jsx` 源码产物；全量 `"solid"` 条件导出 | **可用**：`renderToString` + hydration 冒烟（light / ltr / default 单档）为 M4 验收项 |
| **Phase 1（v0.3 调整）** | 双构建从「骨架」升级为正式构建：源码产物覆盖每个组件子路径 + CI 一一对应校验 | 具备并冻结 `exports` 结构 |
| **v1.0 / Phase 6** | 暗色 / 紧凑 / RTL 全矩阵 SSR 回归、流式渲染、Portal 细则、已知限制清单 | 完整支持 |

v0.2 把双构建提前到 Phase 1 建骨架，v0.3 再提前为 MVP 必备产物：既避免到 Phase 6 才改 `exports` 结构与所有子路径导出造成破坏性变更，也满足「试点主力 SPA / MPA、但 SSR 使用正常」的业务要求（ADR-018）。

---

## 规范摘录：SSR 与 Hydration

> 规范摘录：`docs/02-架构设计.md` → ## 8. SSR 与 Hydration


> **v0.3 边界**（ADR-018）：试点主力 SPA / MPA，不强依赖 SolidStart；但**组件库必须 SSR 可用**。下列 SSR-safe 约束在 MVP 即为验收项；`renderToString` + hydration 冒烟（light / ltr / default 单档）在 M4 验收。暗色 / 紧凑 / RTL 全矩阵 SSR 回归、流式渲染与 Portal 细则仍属 v1.0 目标态。原因见 §3.3 与 01 §6。

- 模块顶层禁止 `window` / `document` / `navigator` / `matchMedia`。
- 使用 `isServer` 分支；只在 `onMount` 注册浏览器 API。
- ID 使用 `createUniqueId`，并加组件前缀；禁止 `Math.random()` 作为初始 ID。
- Portal / 弹层：
  - 默认客户端渲染；SSR 输出占位或空。
  - `ConfigProvider` 的 `portalContainer` 在客户端解析。
- 主题：
  - SSR 由应用在 `<html>` 上预设 `data-scui-theme`，避免首屏闪烁。
  - `ConfigProvider` 的 `theme="system"` 在客户端挂载后解析；服务端默认 `light`。
- 日期 / 相对时间：
  - 服务端与客户端时区可能不同；需要确定性的场景显式传 `timeZone`，或客户端渲染。
- CSS：
  - 消费方负责引入 `styles.css`；SSR 框架需把 CSS 注入 HTML。
  - 文档提供 SolidStart / Vite SSR 示例。
- 验证（**MVP / M4**，Phase 4 执行）：
  - `renderToString` 快照（P0 组件）；
  - `examples/solid-start` 构建 + SSR 渲染 + hydration 冒烟（light / ltr / default 单档）；
  - CI 检查 console hydration warning；`"solid"` 条件在 Vite / Webpack 5 / Rspack / SolidStart 均可解析。
- 验证（**v1.0**，Phase 6 执行）：暗色 / 紧凑 / RTL 全矩阵 SSR 回归、流式渲染、Portal 细则与已知限制清单。

---

## 规范摘录：运行时约束

> 规范摘录：`docs/01-技术选型.md` → ### SSR


**为什么必须双构建（依据 vite-plugin-solid 官方文档）**：Solid 在构建期把 JSX 编译为不同目标的产物（客户端 DOM / 服务端 SSR / 可 hydrate），只发布编译后 JavaScript 等于把目标锁死。官方明确：这种产物是 *client-only DOM code that cannot hydrate*；解法是发布带 `"solid"` 条件的 JSX 源码，由消费方按自身目标重新编译。

- **MVP 产物**：`{ "solid": "./dist/source/*.jsx", "import": "./dist/*.js" }` 双入口，**每个含组件的导出都要有对应的 `solid` 条目**；Phase 0 做可行性 Spike，Phase 1 建成正式构建，M4 验收（见 02 §3.3）。
- **MVP 验收**：`examples/solid-start` 构建 + `renderToString` + hydration 冒烟（light / ltr / default 单档），CI 检查 hydration warning；三端（Vite / Webpack 5 / Rspack）冒烟照旧。
- **SSR-safe 编码升为 MVP 验收项**：模块顶层不访问 `window` / `document` / `matchMedia`；用 `isServer`、`onMount`、`createUniqueId`；ID 确定性。v0.2「仅约束、不验收」的口径作废。
- **v1.0 范围**：暗色 / 紧凑 / RTL 全矩阵的 SSR 回归、流式渲染、Portal 类组件（Modal / Drawer / Tooltip / Select popup）SSR 行为细则、已知限制清单。
- `ConfigProvider` 的主题属性由应用在 HTML 上预设，避免首屏闪烁（客户端同样适用）。

## 规范摘录：验收分档

> 规范摘录：`docs/06-工程规范.md` → ### 5.4 SSR / 消费方（按版本分档）


- **MVP**：`examples/solid-start` 构建 + `renderToString` 快照 + hydration 冒烟（light / ltr / default 单档），无 `console` hydration warning；组件模块顶层无 `window` 访问；`"solid"` 条件导出在每个组件子路径均可解析。
- **v1.0**：暗色 / 紧凑 / RTL 全矩阵 SSR 回归、流式渲染、Portal 细则与已知限制清单。
- `examples/vite` / `examples/webpack` / `examples/rspack` 构建；检查 CSS、类型、tree-shaking。
- 发布前用 `pnpm pack` 产物做一次真实安装测试。

## 相关页面

- [根入口与全部子路径](../exports/root.md)
- [Vite 消费](../guides/vite.md) · [Webpack 5 消费](../guides/webpack.md) · [Rspack 消费](../guides/rspack.md)
