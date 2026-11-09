/**
 * 正式命名单点定义（D-01：Aming 2026-11-08 定名；ADR-020 / X-07）。
 *
 * 方案 A —— 扁平无 npm scope：
 *   对外仓库 / 展示名  solid-craft-ui
 *   主包               solid-craft
 *   兄弟包             solid-craft-icons / solid-craft-tokens
 *   CSS 类名 / 变量 / 配置属性前缀  scui- / --scui-* / data-scui-*
 *
 * 这里是唯一来源；packages/core/src/scope.ts 导出运行时同名常量，
 * scripts/check-exports.mjs 与 scripts/check-naming.mjs 强制校验两者及所有 package.json 一致。
 * 组件根节点类名一律用 `${CSS_PREFIX}button` 拼装，禁止硬编码第二套前缀。
 */
export const REPO_NAME = 'solid-craft-ui';
export const PACKAGE_BASE = 'solid-craft';
export const CSS_PREFIX = 'scui-';

/**
 * 发布仓库单点定义（D-10 ①，Aming 2026-11-08 提供）。
 * 只读体检结论：public、默认分支 main、size 0 / contents 404（刚创建的空仓）。
 * 4 个 package.json 的 repository / homepage / bugs 必须与此同源，
 * 由 scripts/check-release.mjs 强制校验；不得在别处硬编码第二套地址。
 * 2026-11-09 Aming 本人完成首次推送；此后 AI 仅在 Aming 逐次明确授权时可 commit / push，
 * 除 2026-11-09 Aming 本人明确豁免的那次 public 历史重写（docs/08 §25）外，
 * 禁止 force push / 改写历史 / 直推 master。
 */
export const REPO_OWNER = 'hlskysong';
export const REPO_WEB_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
export const REPO_GIT_URL = `git+${REPO_WEB_URL}.git`;
export const REPO_BUGS_URL = `${REPO_WEB_URL}/issues`;

/**
 * npm 发布账号单点定义（D-10 ②，Aming 2026-11-08 提供）。
 * 与 REPO_OWNER 语义独立（当前恰好同名），不要合并成一个常量。
 * 2026-11-08 只读体检：solid-craft / -icons / -tokens 在 registry.npmjs.org 均为 404（未被占用）；
 * 但匿名接口无法确证账号存在性，本机 npm / pnpm whoami 均未登录，
 * 最终由 T1-11 的 npm whoami + 0.1.0-canary.* 预演闭环。
 */
export const NPM_OWNER = 'hlskysong';

/**
 * 发布包 author 单点定义（Aming 2026-11-09 指定：留本人邮箱，不用 GitHub 用户名）。
 * npm 标准 author 字符串 "Name <email>"；3 个发布包必须与此同源，由
 * scripts/check-release.mjs 第 9 条判据逐项校验，避免多处硬编码分叉。
 * 与 git 提交身份一致（Aming / hlsky@foxmail.com），与 npm 账号 hlskysong 语义独立。
 */
export const AUTHOR_NAME = 'Aming';
export const AUTHOR_EMAIL = 'hlsky@foxmail.com';
export const AUTHOR = `${AUTHOR_NAME} <${AUTHOR_EMAIL}>`;

/** CSS 自定义属性与 ConfigProvider 属性前缀，均由 CSS_PREFIX 派生，避免第二套硬编码。 */
export const CSS_VAR_PREFIX = `--${CSS_PREFIX}`;
export const CONFIG_ATTR_PREFIX = `data-${CSS_PREFIX}`;

/** workspace 全部包名（含不发布的 docs / examples），供门禁脚本逐项校验。 */
export const PACKAGE_NAMES = {
  core: PACKAGE_BASE,
  icons: `${PACKAGE_BASE}-icons`,
  tokens: `${PACKAGE_BASE}-tokens`,
  docs: `${REPO_NAME}-docs`,
  'example-vite': `${PACKAGE_BASE}-example-vite`,
  'example-webpack': `${PACKAGE_BASE}-example-webpack`,
  'example-rspack': `${PACKAGE_BASE}-example-rspack`,
  'example-solid-start': `${PACKAGE_BASE}-example-solid-start`,
  'example-start-real': `${PACKAGE_BASE}-example-start-real`,
};
