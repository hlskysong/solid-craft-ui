# Solid Craft UI

SolidJS 企业级中后台组件库。基于细粒度响应式，面向表单、表格、权限与工作流密集的内部业务系统；样式由 CSS Custom Properties 与 `data-*` 状态驱动，按子路径导出、可 tree-shake。

- 主包 **`solid-craft`** · 兄弟包 **`solid-craft-icons`** / **`solid-craft-tokens`**
- CSS 类名 / 变量 / 配置属性前缀：`scui-*` / `--scui-*` / `data-scui-*`
- 仓库：<https://github.com/hlskysong/solid-craft-ui> · 许可证：**MIT**

> ⚠️ **开发中（pre-release）**：三个包尚未发布到 npmjs.org，[安装](#安装发布后)一节是发布后的用法。当前请按[从源码体验](#从源码体验当前可用)本地构建。

## 特性

| 方向 | 说明 |
| --- | --- |
| Solid 原生 | 不套 React 运行时、不做 Web Components；props 接受 `T` 或 `Accessor<T>`，内部用 `resolveValue()` 归一 |
| 双构建 / SSR | 每个入口同时提供编译后 ESM 与保留 JSX 的 `"solid"` 条件产物；`renderToString` + hydrate 已冒烟（含真实 SolidStart） |
| 按子路径引入 | 8 个组件子路径 + `./styles.css` / `./styles/*`，只打包实际用到的部分 |
| 样式与主题 | SCSS → CSS 变量；亮/暗、密度、方向、品牌经 `ConfigProvider` 与 `data-*` 切换；语义色在构建期按 WCAG 2.1 分档校验 |
| 质量保障 | Vitest 单测、Playwright E2E / 视觉基线、axe-core 无障碍、`size-limit` 体积预算、三端消费与 tarball 冒烟 |
| 面向 AI Agent | `llms.txt` / `llms-full.txt` / `llms-manifest.json` 随包发布，版本与所安装版本一致 |

## 安装（发布后）

需要 Node ≥ 24.15（仓库 `.node-version` = 26.12.1）与 `solid-js ^1.9`：

```bash
# shell: fish
pnpm add solid-craft solid-js
```

Vite / Webpack 5 / Rspack / SolidStart 均可消费；样式需显式引入一次。

## 从源码体验（当前可用）

```bash
# shell: fish
git clone https://github.com/hlskysong/solid-craft-ui.git
cd solid-craft-ui
pnpm install
pnpm build
pnpm docs:dev     # 文档站：组件 Demo + API 表
pnpm verify       # 24 阶段全链验收：单测 / E2E / 类型 / lint / 体积 / SSR / tarball / 组件纵向切片
```

> 用 fnm 时，仓库 `.node-version` 会自动切到 Node 26.12.1，直接 `pnpm <script>` 即可。

## 快速上手

```tsx
import { render } from 'solid-js/web';
import { Button } from 'solid-craft/button';
import { ConfigProvider } from 'solid-craft/config-provider';
import 'solid-craft/styles.css';

render(
  () => (
    <ConfigProvider theme="light" density="default" direction="ltr">
      <Button color="primary" variant="solid" onClick={() => console.log('clicked')}>
        确定
      </Button>
    </ConfigProvider>
  ),
  document.getElementById('app')!,
);
```

`Button` 支持 `variant` / `color` / `size` / `shape` / `loading` / `block` / `icon` / `iconPosition` / `htmlType`；默认 `variant="solid"`、`color="primary"`、`htmlType="button"`（避免误触发表单提交）。完整 API 与实时 Demo 见文档站组件页。

## 组件与子路径

| 子路径 | 主要导出 |
| --- | --- |
| `solid-craft` | 全量入口、`CSS_PREFIX` / `UI_SCOPE` / `classNames` / `resolveValue` |
| `solid-craft/button` | `Button`, `ButtonProps` |
| `solid-craft/icon` | `Icon`, `IconProps` |
| `solid-craft/typography` | `Title`, `Text`, `Paragraph`, `Link` |
| `solid-craft/space` | `Space` |
| `solid-craft/divider` | `Divider` |
| `solid-craft/layout` | `Layout`, `Header`, `Sider`, `Content`, `Footer` |
| `solid-craft/grid` | `Row`, `Col` |
| `solid-craft/config-provider` | `ConfigProvider`, `useConfig`, `ConfigProviderContext` |
| `solid-craft/styles.css` | 汇总样式；也可用 `solid-craft/styles/*` 按需引入 |

组件范围仍在扩展，当前为 8 组；规划与验收口径见 `docs/04-组件范围.md`。

## 样式与主题

- 组件根节点使用 `scui-*` 类名，变量为 `--scui-*`；变体与状态走 `data-*`，不用运行时 CSS-in-JS。
- `ConfigProvider` 提供 `theme` / `density` / `direction`；品牌定制覆盖对应 CSS 变量即可。
- 主包 `sideEffects` 只声明 CSS，按需引入样式不会把整个 JS 入口带进 bundle。

## SSR

`exports` 中每个入口都有 `solid`（保留 JSX 源码）与 `import`（编译后 ESM）两个条件。SolidStart 或自定义 SSR 会按 `solid` 条件由消费方重新编译，因此服务端不会命中 client-only DOM 分支，`renderToString` 与 hydrate 均可用。`examples/solid-start` 与 `examples/start-real` 是可运行的冒烟示例。

## 文档

- `pnpm docs:dev` 启动本地文档站（Vite + Solid，TSX Demo + `oxc-parser` 生成的 API 表）。
- 设计与工程规范：`docs/01-技术选型.md` ~ `docs/07-决策与风险.md`；实施清单：`docs/08-实施Todo.md`。
- **给 AI / Agent**：`llms.txt`（索引）、`llms-full.txt`（34 页合并正文）、`llms-manifest.json` 随 `solid-craft` 包发布。已安装时可用 `import.meta.resolve('solid-craft/package.json')` 定位同目录副本，读到的文档版本与安装版本严格一致。
- 消费示例：`examples/vite`、`examples/webpack`、`examples/rspack`、`examples/solid-start`、`examples/start-real`。

## 参与

问题与建议请提 [Issues](https://github.com/hlskysong/solid-craft-ui/issues)。动手前请读 [`AGENTS.md`](./AGENTS.md)（仓库执行约定）与 `docs/06-工程规范.md`；改动后跑 `pnpm verify`。新增组件按 `docs/06` §3 的模板落地，`pnpm check:slice` 会逐项校验源码、样式、单测、Demo、exports 子路径、双构建产物与文档生成物是否齐备，缺任一环即红灯。

发布链路可在本地完整预演：`pnpm preview:release` 会把版本化、打包、发布、安装、消费跑到只监听 `127.0.0.1` 的临时 registry，不触达公网，产物落在仓库外 `.solid-craft-preview/`。`pnpm stage:release -- --tag canary --dry-run` 可本地验收受控发布通道的 staging 组装，同样不连公网。真实对外发布是 `pnpm release`，由维护者逐次授权执行；CI 侧受控通道只把包提交到 npm 暂存队列，仍须维护者 2FA 批准才上线。

## License

MIT © Solid Craft UI contributors · 见 [LICENSE](./LICENSE)
