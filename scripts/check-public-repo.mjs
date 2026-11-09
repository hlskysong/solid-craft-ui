/**
 * public 仓库内容安全门禁（D-10 ①：Aming 于 2026-11-09 完成首次推送后新增）。
 *
 * 背景：hlskysong/solid-craft-ui 是 **public** 仓库，首次推送只有 1 个 commit。
 * 公开仓库发出去就收不回来，因此把「入库内容不得含凭据 / 内网地址 / 私有工作区数据」
 * 钉成机器判据，并要求 origin 与 scripts/scope.mjs 的 REPO_GIT_URL 单点定义同源。
 *
 * 判据：
 *   1. 本地必须是 git 仓库，且顶层目录就是本仓库；
 *   2. origin URL 归一化后与 REPO_GIT_URL 一致（兼容 CI checkout 的 URL 形态）；
 *   3. 当前分支（非 detached 时）必须是 main；detached 只报告不拦截；
 *   4. git ls-files 关掉 core.quotepath（否则中文路径会被八进制转义而漏扫）后
 *      必须 ≥200 项，逐文件做危险文件名 + 敏感内容扫描，二进制跳过；
 *   5. .npmrc 允许入库但不得含发布凭据、不得声明仓库级 registry、
 *      不得残留「私有 registry」语义（D-09 已定公开 npmjs.org）；
 *   6. .gitignore 必须挡住 .workbuddy/ / node_modules/ / dist/ / .env；
 *   7. 根与 3 个发布包的 LICENSE 必须存在且为 MIT。
 *
 * 刻意不做两件事：
 *   - 不校验 HEAD == origin/main：正常开发本地必然领先远端，做成硬判据会让
 *     每次提交后的 pnpm verify 假红灯；本脚本只在成功输出里报告两者 sha。
 *   - 不在本文件里硬编码任何真实凭据串（那等于把凭据写进 public 仓库），
 *     只检测通用形态；真实串的比对放在不入库的临时体检脚本里。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { REPO_GIT_URL, REPO_NAME } from './scope.mjs';

const repoRoot = resolve(import.meta.dirname, '..');
const errors = [];
const fail = (message) => errors.push(message);
const read = (rel) => {
  const abs = join(repoRoot, rel);
  return existsSync(abs) ? readFileSync(abs, 'utf8') : '';
};
const git = (...args) => {
  try {
    return execFileSync('git', ['-C', repoRoot, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '';
  }
};

// 1. 本地仓库身份
const top = git('rev-parse', '--show-toplevel');
if (top.length === 0) fail('当前目录不是 git 仓库，public 内容审计无法进行');
else if (resolve(top) !== repoRoot) fail(`git 顶层目录异常：${top} != ${repoRoot}`);

// 2. origin 与单点定义同源。git+ / .git 后缀 / Actions checkout 形态都归一化掉。
const normalizeRemote = (url) =>
  String(url)
    .replace(/^git\+/, '')
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/\.git$/, '')
    .replace(/\/$/, '')
    .toLowerCase();
const origin = git('remote', 'get-url', 'origin');
if (origin.length === 0) fail('缺少 origin remote，无法确认推送目标');
else if (normalizeRemote(origin) !== normalizeRemote(REPO_GIT_URL)) {
  fail(`origin 与 scope.mjs 单点定义分叉：${origin} != ${String(REPO_GIT_URL)}`);
}

// 3. 分支：detached HEAD（CI 的 PR checkout）不拦截。
const branch = git('symbolic-ref', '--quiet', '--short', 'HEAD');
if (branch.length > 0 && branch !== 'main') {
  fail(`当前分支 ${branch} 不是 main（首次推送分支为 main，禁止推 master）`);
}
const head = git('rev-parse', 'HEAD');
const remoteMain = git('rev-parse', '--verify', 'origin/main');
if (head.length === 0) fail('无法解析 HEAD');

// 4. tracked 文件：危险文件名 + 敏感内容
const tracked = git('-c', 'core.quotepath=false', 'ls-files', '-z')
  .split('\0')
  .filter((rel) => rel.length > 0);
if (tracked.length < 200) {
  fail(`git ls-files 仅 ${tracked.length} 项（应 ≥200），审计清单可能为空导致假通过`);
}

const DANGEROUS_NAMES = [
  ['环境变量文件', /(^|\/)\.env(\.|$)/i],
  ['私有工作区数据', /(^|\/)\.workbuddy\//i],
  ['依赖副本', /(^|\/)node_modules\//i],
  ['构建产物', /(^|\/)dist\//i],
  ['临时产物', /(^|\/)(?:\.artifacts|test-results|playwright-report|coverage)\//i],
  ['私钥文件', /(?:id_rsa|id_ed25519)|\.pem$|\.key$|\.p12$|\.pfx$/i],
  ['凭据文件', /credentials|secrets?\.json$/i],
];
const FORBIDDEN = [
  ['npm token', /npm_[A-Za-z0-9]{20,}/],
  ['GitHub token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/],
  ['GitHub fine-grained PAT', /github_pat_[A-Za-z0-9_]{20,}/],
  ['npm authToken', /_authToken\s*=/],
  ['私钥头', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['凭据赋值', /(?:password|passwd|secret|api[_-]?key)\s*[:=]\s*["'][^"']{8,}["']/i],
  ['内网 IPv4', /\b(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))(?:\.\d{1,3}){3}\b/],
  ['内网域名', /[a-z0-9-]+\.(?:jzeg\.cn|ops\.[a-z.]+|internal|intranet)/i],
  ['本机绝对路径', /(?:\/Users\/|\/home\/|\/root\/)[A-Za-z0-9_.-]+/],
];
const BINARY_EXT = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.pdf',
  '.zip',
  '.tgz',
  '.gz',
  '.wasm',
  '.node',
]);
let scanned = 0;
for (const rel of tracked) {
  for (const [label, re] of DANGEROUS_NAMES) {
    if (re.test(rel)) fail(`public 仓库不应入库「${label}」：${rel}`);
  }
  const base = rel.split('/').at(-1) ?? '';
  if (BINARY_EXT.has(`.${base.split('.').at(-1)}`.toLowerCase())) continue;
  const abs = join(repoRoot, rel);
  if (!existsSync(abs)) continue;
  let text = '';
  try {
    text = readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  scanned += 1;
  for (const [label, re] of FORBIDDEN) {
    const match = text.match(re);
    if (match) fail(`public 内容审计：${rel} 命中「${label}」→ ${match[0].slice(0, 60)}`);
  }
}

// 5. 仓库级 .npmrc：不写入凭据，也不声明 registry（否则 CI install / changeset publish 被带偏）
const npmrc = read('.npmrc');
if (npmrc.length > 0) {
  if (/^\s*registry\s*=/m.test(npmrc)) {
    fail('仓库级 .npmrc 声明了 registry：CI 与 publish 会被本机镜像带偏，镜像偏好应放 ~/.npmrc');
  }
  if (/^\s*(?:\/\/[^=]+=)?_authToken\s*=/m.test(npmrc) || /npm_[A-Za-z0-9]{20,}/.test(npmrc)) {
    fail('仓库级 .npmrc 含发布凭据，public 仓库严禁提交');
  }
  if (/私有\s*registry/i.test(npmrc)) {
    fail('仓库级 .npmrc 残留「私有 registry」语义，D-09 已定公开 npmjs.org');
  }
}

// 6. .gitignore
const gitignore = read('.gitignore');
for (const token of ['.workbuddy/', 'node_modules/', 'dist/', '.env']) {
  if (!gitignore.includes(token))
    fail(`.gitignore 未挡住 ${token}（会被 git add . 带进 public 仓库）`);
}

// 7. MIT LICENSE（根 + 3 个发布包）
const licenseTargets = [
  'LICENSE',
  'packages/core/LICENSE',
  'packages/icons/LICENSE',
  'packages/tokens/LICENSE',
];
for (const rel of licenseTargets) {
  if (!read(rel).startsWith('MIT License')) fail(`${rel} 缺失或不是 MIT 许可证`);
}

if (errors.length > 0) {
  console.error(`[check:public] ${errors.length} 项不合规：`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
const sync =
  remoteMain.length === 0
    ? '远端 ref 未抓取'
    : head === remoteMain
      ? 'HEAD 与 origin/main 一致'
      : '本地领先远端（正常开发态）';
console.log(
  `[check:public] ${REPO_NAME} public 仓库安全：origin 与 scope.mjs 同源 · ${tracked.length} 个 tracked 文件（含中文路径）/ ${scanned} 个文本零敏感命中 · ${DANGEROUS_NAMES.length} 类危险文件零入库 · .npmrc 无凭据且无 registry 声明 · .gitignore 挡住 .workbuddy/ 与 .env* · ${licenseTargets.length} 份 MIT LICENSE · 分支 ${branch || 'detached（跳过）'} · ${sync}`,
);
