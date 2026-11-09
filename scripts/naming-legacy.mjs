/**
 * 占位名 → 正式名映射（D-01，Aming 2026-11-08 定名）。
 *
 * 存在理由：docs/01~07 是 v0.3 冻结规范，受 check:goals 的 SHA256 基线保护，
 * 正文里全是改名前占位名（@ui-design/*、--ui-*、.ui-*、data-ui-*、ui-design）。
 * 但 apps/docs/public/llms/** 与包内 llms-full.txt 会从这些规范摘录正文，
 * 不处理就会把占位名发布到对外文档里。
 *
 * 解法：冻结文件一个字节都不改，生成链路在 specSection() 输出前统一走 applyNaming()。
 * 本文件是唯一允许出现占位名的真源，check:naming 显式豁免它并校验覆盖率。
 *
 * 注意顺序：长串优先，否则 @ui-design/core 会被短规则截断成错误结果。
 */
import { CSS_PREFIX, PACKAGE_BASE, REPO_NAME } from './scope.mjs';

const iconName = `${PACKAGE_BASE}-icons`;
const tokensName = `${PACKAGE_BASE}-tokens`;

/** 有序字面映射；新增占位形态必须同步补本节与 check-naming.mjs 的 TOKENS。 */
export const LEGACY_REPLACEMENTS = [
  ['@ui-design/example-solid-start', `${PACKAGE_BASE}-example-solid-start`],
  ['@ui-design/example-start-real', `${PACKAGE_BASE}-example-start-real`],
  ['@ui-design/example-webpack', `${PACKAGE_BASE}-example-webpack`],
  ['@ui-design/example-rspack', `${PACKAGE_BASE}-example-rspack`],
  ['@ui-design/example-vite', `${PACKAGE_BASE}-example-vite`],
  ['@ui-design/docs', `${REPO_NAME}-docs`],
  ['@ui-design/core', PACKAGE_BASE],
  ['@ui-design/icons', iconName],
  ['@ui-design/tokens', tokensName],
  ['@ui-design/*', `${PACKAGE_BASE} / ${iconName} / ${tokensName}`],
  ['@ui-design/', `${PACKAGE_BASE}/`],
  ['@ui-design', PACKAGE_BASE],
  ['unplugin-ui-design', `unplugin-${PACKAGE_BASE}`],
  ['--ui-', `--${CSS_PREFIX}`],
  ['data-ui-', `data-${CSS_PREFIX}`],
  ['.ui-', `.${CSS_PREFIX}`],
  ['ui-design-workspace', `${REPO_NAME}-workspace`],
  ['ui-design/', `${REPO_NAME}/`],
  ['ui-design', REPO_NAME],
];

/** 剩余裸 ui- 类名前缀（规范里可能写成 `ui-button` 而不带点号）。 */
const BARE_PREFIX = /(?<![\w-])ui-(?!design)/g;

export function applyNaming(text) {
  let result = text;
  for (const [from, to] of LEGACY_REPLACEMENTS) result = result.replaceAll(from, to);
  return result.replace(BARE_PREFIX, CSS_PREFIX);
}

/** 把一段冻结规范正文映射后，若仍含占位形态则返回命中项（供自检）。 */
export function legacyHits(text) {
  const mapped = applyNaming(text);
  return [
    '@ui-design',
    '--ui-',
    'data-ui-',
    '.ui-',
    'unplugin-ui-design',
    /\bui-(?!design)/,
    /(?<![\w/-])ui-design(?![/\w-])/,
  ].filter((token) => (typeof token === 'string' ? mapped.includes(token) : token.test(mapped)));
}
