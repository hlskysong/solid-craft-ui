# AGENTS.md — solid-craft-ui 仓库执行约定

> 供 AI 编码代理（opencode / WorkBuddy）读取。**规范全文见 `docs/01~07`（v0.3）**，本文件只列执行时必须遵守的硬约束与落盘清单；冲突时以 `docs/01~07` 为准。
> 本文件对应实施清单 `docs/08-实施Todo.md` 的 T0-01 / T0-02。
> 目标基线 SHA256: 36e4a1147b6127ff2ee6a31991aa019f16a0a94048d2c41a696023484d3814c4

## 1. 运行环境

- Node **26.12.1**（fnm default，仓库 `.node-version` 已固定；CI 基线为 24 LTS ≥24.15）、pnpm **12.16.1**、TypeScript **7.0.2**（原生二进制，依赖 `@typescript/typescript-*` 平台包）。
- **2026-11-09 Aming 用 `fnm ls` 截图纠正：必须分清两种 shell，别把工具沙箱当成本机环境**（此前误写「本机默认 node 22.22.2」）：
  - 交互式终端：fnm 已激活，`fnm ls` 显示 `v26.12.1 default`，`.node-version` 同为 26.12.1 ⇒ **直接 `pnpm <script>`，不需要包 `fnm exec`**。
  - AI 工具的非交互 shell（`/bin/sh`）：每次是全新进程，PATH 最前被工具自带的 Node **22.22.2** 占据，fnm hook 不生效 ⇒ **只有在这里**才必须 `fnm exec --using 26.12.1 -- pnpm <script>`。
  - **22.22.2 是工具沙箱运行时，不是本机默认 Node**；对外说明/文档不得把它写成「本机默认」。
- 本仓库是 public，**禁止在文档里写死本机绝对路径 / 用户名**（`check:public` 会拦截）。

交互式终端（推荐）：

```bash
# shell: fish
pnpm <script>
```

仅 AI 工具的非交互 shell：

```sh
# shell: sh
fnm exec --using 26.12.1 -- pnpm <script>
```

- 四条验收命令：`pnpm build`、`pnpm test`、`pnpm lint`、`pnpm typecheck`（全部 rc=0 才算完成）。
- 发布前另跑：`pnpm publint`、`pnpm attw`、`pnpm check:exports`。

## 2. 仓库结构（Phase 0 脚手架）

```text
ui-design/
├─ packages/tokens/     DTCG JSON → dist/css|ts|json（Token 管线 T1-01 再接 Style Dictionary）
├─ packages/icons/      Solid 图标包（T1 再接 lucide-solid 生成器）
├─ packages/core/       组件、样式、locale、hooks、utils
├─ scripts/             构建与门禁脚本（scope.mjs 是品牌名/前缀唯一来源）
├─ apps/  examples/     占位，Spike S-01 再落最小应用
└─ docs/               规划文档（v0.3），**禁止改动**
```

## 3. 硬约束（违反即验收失败）

1. **正式名单点定义**（D-01，Aming 2026-11-08 定名）：`scripts/scope.mjs` 的 `REPO_NAME='solid-craft-ui'` / `PACKAGE_BASE='solid-craft'` / `PACKAGE_NAMES` / `CSS_PREFIX='scui-'` 是唯一来源；`packages/core/src/scope.ts` 导出运行时常量，`scripts/check-exports.mjs` 与 `scripts/check-naming.mjs` 强制校验所有 `package.json` 名称与前缀派生一致。主包 `solid-craft`、兄弟包 `solid-craft-icons` / `solid-craft-tokens`（**无 npm scope**）。组件根节点类名用 `` `${CSS_PREFIX}button` `` 之类拼装，CSS 变量 `--scui-*`、配置属性 `data-scui-*` 均由前缀派生，**不要硬编码第二套前缀**。D-10 ① 的仓库地址同样在此单点定义（`REPO_GIT_URL` / `REPO_WEB_URL` / `REPO_BUGS_URL`），4 个 `package.json` 由 `check:release` 校验同源；D-10 ② 的 npm 账号为 `NPM_OWNER='hlskysong'`（与 `REPO_OWNER` 语义独立，勿合并），由 `check-release` 第 8 条校验与 `docs/08` 的 D-10 行双向咬合。发布包 author 由 `AUTHOR_NAME` / `AUTHOR_EMAIL` / `AUTHOR` 单点定义（Aming 2026-11-09 指定留本人邮箱 `hlsky@foxmail.com`，不用 GitHub 用户名），`check-release` 第 9 条校验 3 个发布包同源。
2. **响应式契约**：props 一律传值或 getter，由组件内部 `props.xxx` / `splitProps` 读取；**禁止解构 props**（`noSolidDestructuredProps`）。派生状态用 `createMemo`，字段级更新不整表重渲染。
3. **状态只用 `data-*`**：变体 / 尺寸 / 颜色 / 形状 / 加载 / block 一律 `data-variant` / `data-size` / `data-color` / `data-shape` / `data-loading` / `data-block`；**不生成 `scui-button--sm` 之类 modifier class**，SCSS 只认 `[data-*]` 选择器。
4. **size 唯一口径**：`small | medium | large`（默认 `medium`）；不存在 `md` / `sm`。
5. **Button 默认 `color='primary'`**（ADR-019 / Q16），默认 `variant='solid'`；`neutral` 需显式传入。原生 `type` 默认 `button`，`loading` 时 `disabled` + `aria-busy`。
6. **组件源码不 import SCSS**：样式由 `scripts/build-css.mjs` 独立产出到 `dist/styles/`，CSS 由消费方显式引入。
7. **SSR-safe**：模块顶层禁止访问 `window` / `document`；a11y ID 用 `createUniqueId()`，禁止随机数；不引入 client-only 副作用。
8. **双构建是 MVP 必备（ADR-018）**：`dist/esm`（编译后 JS）与 `dist/source/*.jsx`（保留 JSX 源码）一一对应；`package.json` 中**每个含组件的 `exports` 子路径**都必须同时写 `types` / `solid` / `import` 三条。CSS 与 `./package.json` 不需要 `solid`。`pnpm build` 会调用 `scripts/check-exports.mjs`，缺失即失败。
9. **命名**：组件文件 PascalCase、目录/样式/hook/工具 kebab-case、测试 `*.test.tsx`、Demo `demos/*.tsx`；组件用命名导出，`index.ts` 只做公共导出。
10. **类型**：`strict` + `noUncheckedIndexedAccess`；禁止 `any`（用 `unknown` + 守卫）；不用 `enum`；Props 用 `interface`；公共类型带 JSDoc 与 `@default`；不使用 `baseUrl`（TS 7 已移除）。
11. **焦点**：`:focus-visible` 用 `2px outline + 2px offset`，禁止 `outline: none` 裸用。
12. **测试**：Vitest + `@solidjs/testing-library` + jsdom；`toBeInTheDocument` 等 jest-dom matcher 已由 `vitest.setup.ts` 注入；断言 `data-*` 与 A11y 属性，不测实现细节。
13. **正式名已定（D-01 `[x]`，Aming 2026-11-08 本人给定）**：仓库 / 展示名 `solid-craft-ui`，主包 `solid-craft`，兄弟包 `solid-craft-icons` / `solid-craft-tokens`，CSS / 组件前缀 `scui-*`。**只有 Aming 本人可再次改名或勾 D-10**（2026-11-09 已明确授权 AI 代勾本行一次，见 §27）；AI 不得擅自注册 scope、发布或写入发布目标。定名不等于放行：D-10 ① GitHub 仓库地址已由 Aming 2026-11-08 提供（`https://github.com/hlskysong/solid-craft-ui.git`，public / `main`，单点定义见硬约束 1），并已于 **2026-11-09 由 Aming 本人完成首次推送**（HEAD=origin/main、`check:public` 审计零敏感命中）；② npm 账号 `hlskysong` 亦已登记（三个包名 npmjs.org 只读体检均 404 未占用；2026-11-09 `npm whoami` = `hlskysong` 已由登录态确证账号存在性），**③ ✅ 发布凭据 / 登录态已闭环**（凭据仅存于用户级 `~/.npmrc`，仓库内 `.npmrc` 零凭据），**④ ✅ 已由 Aming 重定义为「本地预演（不 publish）」并闭环**：链路固化为 `pnpm preview:release`（`scripts/preview-release.mjs` / `preview-registry.mjs`，只连 127.0.0.1），由 `check:release` 第 10 条判据钉死，实测零公网请求（§27）；changesets pre 首个真实产出为 `0.1.1-canary.0`，旧 `0.1.0-canary.*` 口径已纠正。**D-10 主行 `[x]`**（Aming 2026-11-09 授权），`check:release --strict` RC=0。⚠️ **放行 ≠ 授权 publish**：`pnpm release` / 公网发布仍须 Aming 逐次明确授权，AI 不得在无人值守流程里擅自执行；**T1-11 已由 §28 重定义为 OIDC stage-only 受控发布通道并勾选**：`release.yml` 仅手动触发 + environment 审批 + OIDC 短期凭据，零长期凭据；`check:ci` 全 workflow 扫描与 `check:release` 第 11 条共同钉死「禁直发 / 禁 push 自动发包 / 只许暂存提交」，npm 账号侧 trusted publisher 配置与首包发布仍是 Aming 人工前置；`pnpm release` 仍是人工直发路径，须逐次授权。**2026-11-09 Aming 明确授权 AI 提交并推送本轮改动（§23），并本人决定把 public 历史重写为单一干净 root commit 后强推（§25）**；重写后此前 3 个 commit 的 SHA（`f1ae98e` / `b8606c0` / `fa15f5d`）全部作废，§22/§23/§24 中的引用仅作历史叙述、不可再解析，当前 SHA 一律以 `git rev-parse HEAD` 为准；此后 AI 仅在逐次明确授权时执行 `git commit` / `git push origin main`，**除 §25 已豁免的这次历史重写外，禁止 force push / 改写历史 / 直推 master**，提交身份必须为 `Aming / hlsky@foxmail.com`；每次推送前须 `pnpm check:public` RC=0。渠道 GitHub + 公开 npmjs.org（D-09）。
14. **上下文恢复第一件事**：读 `docs/08` 顶部的「当前锚点」，收尾时增量更新它。禁止一次性批量勾选；每个 `[x]` 必须在验收输出区块被点名，新增依赖倒挂会被 `check:todo` 拦下，历史例外只减不增。改 `docs/01~07` / 本文件 / 治理脚本会触发 `check:goals` 基线红灯，必须人工确认后跑 `pnpm check:goals --update-baseline`。
15. **冻结规范与正式名并存**：`docs/01~07` 是 v0.3 冻结基线，正文仍为改名前占位名，**一个字节都不许改**；`scripts/naming-legacy.mjs` 是唯一允许出现占位名的真源，`generate-llms.mjs` 生成对外产物时必须过 `applyNaming()` 映射层。`scripts/check-naming.mjs` 校验真源与对外产物零残留 + 映射层自证。本地工作目录仍叫 `ui-design/`，属路径不是品牌名，不参与改名。

## 4. 新增一个组件必须同时落盘

| 文件 | 内容 |
| --- | --- |
| `packages/core/src/components/<kebab>/types.ts` | `interface XxxProps` + JSDoc |
| `packages/core/src/components/<kebab>/Xxx.tsx` | 组件实现（照 `docs/06-工程规范.md` §3 唯一模板） |
| `packages/core/src/components/<kebab>/<kebab>.scss` | `[data-*]` 选择器，只用 token 变量 |
| `packages/core/src/components/<kebab>/index.ts` | 只做公共导出 |
| `packages/core/src/components/<kebab>/Xxx.test.tsx` | 渲染 / 键盘 / `data-*` 断言 |
| `packages/core/src/index.ts` | 追加公共导出 |
| `packages/core/package.json` | `exports["./<name>"]` 加 `types` / `solid` / `import` 三条 |

构建脚本自动扫描 `src/` 生成多入口，**不需要改 vite.config.ts**。

## 5. 禁止事项

- 不改 `docs/**` 下任何文件、不改 `pnpm-lock.yaml`（由 `pnpm install` 生成）、不改根级配置（package.json / turbo.json / tsconfig / lint 配置）。
- 不新增依赖、不写 CJS、不产出 modifier class、不在组件里运行时 import CSS、不使用 `Math.random()` 生成 SSR ID。
- 不把 `docs/01~07` 的规划内容抄进代码注释；不做超出指派任务 ID 的重构。

## 6. 当前脚手架已提供

- `pnpm build`：`tokens → icons → core`，产出 `dist/esm` / `dist/source` / `dist/types` / `dist/styles`，并跑 exports 门禁。
- `pnpm test`：Vitest + Solid + jsdom + jest-dom（`src/__tests__/scaffold.test.tsx` 为链路冒烟）。
- `pnpm lint`：oxlint `--type-aware` + Biome `solid` domain + Stylelint 17 + Prettier `--check`。
- `pnpm typecheck`：TS 7 `tsc --noEmit`（`tsconfig.build.json` 已显式 `rootDir: src` + `include` + `skipLibCheck`）。
- `LICENSE` 为 MIT，各包 `package.json` 均声明 `"license": "MIT"`。
