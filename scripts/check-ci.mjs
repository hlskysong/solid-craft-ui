/**
 * T1-07 CI 契约门禁：让「CI 全绿」变成机器可验的契约，而不是靠人记住该跑哪些命令。
 *
 * 平台无关部分全部落在这个脚本里；切换 CI 平台只需替换 .github/workflows/ci.yml。
 * 判据：
 *   1. 根 verify 脚本阶段齐全（06 §1.3 / §13.1 的 lint/typecheck/unit/build/size/
 *      publint/attw/Playwright + 本仓库已有的 check:* 与 4 个 smoke），且 build 必须
 *      排在 size / check:styles / check:release / check:naming / check:ci 之前（五者都读 dist 产物）。
 *   2. .size-limit.json 每条的名称与预算值逐字对齐 docs/02 §4.6（唯一真源）；
 *      规范里产物尚未实现的预算行只报告、不伪造配置。
 *   3. 每条 path glob 至少命中一个真实的 dist 文件 —— 防止 size-limit 空匹配
 *      算成 0 字节而「假 PASS」。
 *   4. CI workflow 契约：--frozen-lockfile、pnpm verify、各架构 tsc --version、
 *      node-version-file、多架构 matrix、与截图基线同平台；且不含任何 registry
 *      地址或发布凭据（渠道已定为公开 npmjs.org、D-01 正式名已定、D-10 ①② 已登记
 *      且首次推送已完成，但 ③④ 发布前置资源未齐 / T1-11 未完成，发布 job 不许先写死）。
 *   5. 工具链单点：size 脚本必须走 size-limit，且 @size-limit/file 插件已声明。
 */
import { existsSync, globSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const errors = [];
const read = (abs) => (existsSync(abs) ? readFileSync(abs, 'utf8') : '');
const fail = (message) => errors.push(message);
const toKb = (value, unit) => (unit.toUpperCase() === 'MB' ? value * 1024 : value);

const rootPkg = JSON.parse(read(join(repoRoot, 'package.json')));
const sizeConfigPath = join(repoRoot, '.size-limit.json');
const workflowPath = join(repoRoot, '.github', 'workflows', 'ci.yml');

// 1. verify 阶段契约
const verify = rootPkg.scripts?.verify ?? '';
const stages = [...verify.matchAll(/pnpm\s+([\w:.-]+)/g)].map((match) => match[1] ?? '');
const requiredStages = [
  'build',
  'test',
  'test:e2e',
  'typecheck',
  'lint',
  'check:docs',
  'check:llms',
  'check:styles',
  'check:release',
  'check:naming',
  'check:public',
  'check:goals',
  'check:todo',
  'check:platforms',
  'size',
  'check:ci',
  'check:exports',
  'publint',
  'attw',
  'smoke:consumers',
  'smoke:tarball',
  'smoke:ssr',
  'smoke:start-real',
];
for (const stage of requiredStages) {
  if (!stages.includes(stage)) fail(`verify 缺少必需阶段 pnpm ${stage}`);
}
const buildAt = stages.indexOf('build');
for (const stage of ['size', 'check:styles', 'check:release', 'check:naming', 'check:ci']) {
  if (buildAt >= 0 && stages.indexOf(stage) >= 0 && stages.indexOf(stage) < buildAt) {
    fail(`pnpm ${stage} 依赖 dist 产物，必须排在 pnpm build 之后`);
  }
}

// 2. 体积预算与 docs/02 §4.6 同源
const archDoc = read(join(repoRoot, 'docs', '02-架构设计.md'));
const budgetSection = archDoc.split('### 4.6 产物体积预算')[1]?.split('\n---')[0] ?? '';
const budgets = new Map();
for (const line of budgetSection.split('\n')) {
  const match = line.match(/^\|\s*([^|]+?)\s*\|\s*≤\s*([\d.]+)\s*(KB|MB)\s*\|/);
  if (match?.[1] && match[2] && match[3]) {
    budgets.set(match[1].trim(), toKb(Number(match[2]), match[3]));
  }
}
if (budgets.size === 0) fail('无法从 docs/02 §4.6 解析体积预算表（标题或表格格式变化）');

const checks = existsSync(sizeConfigPath) ? JSON.parse(read(sizeConfigPath)) : [];
if (!Array.isArray(checks) || checks.length === 0) {
  fail('.size-limit.json 缺失或为空');
}
const covered = new Set();
for (const check of checks) {
  const expected = budgets.get(check.name);
  if (expected === undefined) {
    fail(`.size-limit.json 条目 "${check.name}" 不在 docs/02 §4.6 预算表内`);
    continue;
  }
  covered.add(check.name);
  const limitMatch = String(check.limit ?? '').match(/^([\d.]+)\s*(KB|MB)$/i);
  if (!limitMatch?.[1] || !limitMatch[2]) {
    fail(`${check.name} 的 limit 格式非法："${check.limit}"`);
    continue;
  }
  const actual = toKb(Number(limitMatch[1]), limitMatch[2]);
  if (actual !== expected) {
    fail(`${check.name} 预算 ${actual} KB 与 docs/02 §4.6 的 ${expected} KB 不一致`);
  }
  if (check.gzip !== true) fail(`${check.name} 未显式开启 gzip（02 §4.6 预算口径是 gzip）`);

  // 3. path 必须命中真实 dist 文件，避免空匹配假 PASS
  const patterns = Array.isArray(check.path) ? check.path : [check.path];
  const files = patterns.flatMap((pattern) =>
    typeof pattern === 'string' ? globSync(pattern, { cwd: repoRoot }) : [],
  );
  if (files.length === 0)
    fail(`${check.name} 的 path 未匹配到任何产物文件（size-limit 会算成 0 字节）`);
  const outsideDist = files.filter((file) => !file.includes('/dist/'));
  if (outsideDist.length > 0) {
    fail(`${check.name} 的 path 含非 dist 文件：${outsideDist.slice(0, 3).join(', ')}`);
  }
}

// 4. CI workflow 契约
const workflow = read(workflowPath);
if (workflow.length === 0) {
  fail('缺少 .github/workflows/ci.yml');
} else {
  const requiredTokens = [
    'pnpm install --frozen-lockfile',
    'pnpm verify',
    'pnpm exec tsc --version',
    'pnpm check:platforms',
  ];
  for (const token of requiredTokens) {
    if (!workflow.includes(token)) fail(`ci.yml 缺少 ${token}`);
  }
  if ((workflow.match(/tsc --version/g) ?? []).length < 2) {
    fail('ci.yml 的 tsc --version 少于 2 处（主门禁 job 与多架构 job 都要跑）');
  }
  if (!/node-version-file:\s*['"]?\.node-version['"]?/.test(workflow)) {
    fail('ci.yml 未通过 node-version-file 绑定 .node-version');
  }
  if (!/runs-on:\s*macos-15/.test(workflow)) {
    fail('ci.yml 主门禁未使用与截图基线相同的 macOS runner（基线绑定 macOS + 系统 Chrome）');
  }
  if (!workflow.includes('matrix:')) fail('ci.yml 缺少多架构 matrix');
  const osList = workflow.match(/^\s*os:\s*\[([^\]]+)\]/m)?.[1];
  if (!osList || osList.split(',').filter(Boolean).length < 3) {
    fail('ci.yml 的 matrix 架构少于 3 个（S-09 要求各架构验证平台包）');
  }
  if (/NPM_TOKEN|NODE_AUTH_TOKEN|npm publish|registry:\s*https?:\/\//.test(workflow)) {
    fail(
      'ci.yml 出现 registry 地址或发布凭据；D-10 发布前置资源未齐（①② 已登记且已推送，③④ 凭据 / canary 预演仍缺）且 T1-11 未完成，发布 job 不得先写死',
    );
  }
}

// 5. 工具链单点
if (!String(rootPkg.scripts?.size ?? '').includes('size-limit')) {
  fail('根 size 脚本未使用 size-limit（06 §12 要求 CI 运行 size-limit）');
}
const sizeLimit = rootPkg.devDependencies?.['size-limit'];
const filePlugin = rootPkg.devDependencies?.['@size-limit/file'];
if (!sizeLimit) fail('devDependencies 缺少 size-limit');
if (!filePlugin) fail('devDependencies 缺少 @size-limit/file（file 插件才能算 gzip 文件体积）');
if (sizeLimit && filePlugin && sizeLimit !== filePlugin) {
  fail(`size-limit@${sizeLimit} 与 @size-limit/file@${filePlugin} 版本不一致`);
}

if (errors.length > 0) {
  console.error(`[check:ci] ${errors.length} 项不合规：`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
const pending = [...budgets.keys()].filter((name) => !covered.has(name));
console.log(
  `[check:ci] verify ${requiredStages.length} 个阶段齐全且 build 优先 · 体积预算 ${checks.length}/${budgets.size} 条与 02 §4.6 一致（未实现：${pending.join(' / ') || '无'}）· path 全部命中 dist · ci.yml 契约齐全且无发布凭据 · size-limit@${sizeLimit} + file 插件`,
);
