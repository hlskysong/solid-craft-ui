/**
 * 发布闸门（ADR-020 / D-01 / D-09 / D-10）。
 *
 * 背景：2026-11-06 Aming 定了发布渠道 GitHub + 公开 npmjs.org（D-09）；
 * 2026-11-08 Aming 定了正式名（D-01）：仓库 solid-craft-ui、主包 solid-craft、
 * CSS 前缀 scui-*；同日又提供 GitHub 仓库地址（D-10 ①）与 npm 账号 hlskysong（D-10 ②，
 * NPM_OWNER 单点定义，三个扁平包名在 registry.npmjs.org 只读体检均 404 未占用）；
 * 2026-11-09 Aming 本人完成首次推送（单 commit / HEAD=origin/main / public 内容审计零命中）。
 * 但**有名字 + 有仓库 + 有账号 + 已推送 ≠ 可以发布** —— 账号存在性未由登录态确证，
 * 发布凭据（本机 whoami 未登录、.npmrc 无凭据）与 0.1.0-canary.* 预演仍缺（D-10 ③④），
 * T1-11 无法闭环。所以本闸门把「发布前置资源」钉成机器判据，让 AI 在无人干预地跑任务流时
 * 也不可能提前 publish。
 *
 * 两种模式：
 *   - 常规（verify 调用）：只校验渠道配置与公开内容安全，不阻塞日常开发；
 *   - --strict（release 调用）：额外要求 D-01 已定 + D-10 已齐 + 命名零残留。
 *
 * 判据：
 *   1. .changeset/config.json 的 access=public（公开 npmjs.org 必需）。
 *   2. fixed / linked / ignore 里的包名必须都是 workspace 真实存在的包。
 *   3. release 脚本必须前置 check:release --strict，且排在 changeset publish 之前；
 *      命名门禁 check:naming 必须排在 build 之后、publish 之前。
 *   4. core 包 files 展开后的全部文件 **+ npm 强制打包的 4 个 package.json** 内容审计：
 *      内网地址、本机路径、疑似凭据、敏感文件名。公开仓库发出去就收不回来。
 *   5. D-01 / D-10 状态从 docs/08 §0 表格读取；--strict 下两者都必须 [x]。
 *   6. --strict 下核心包名单点定义必须与 scope.mjs 一致，且 llms.txt 用正式名。
 *   7. 根 workspace 与 3 个发布包的 repository / homepage / bugs 必须与 scope.mjs
 *      单点定义同源，防止地址在多个 package.json 里分叉或写错而无人发现。
 *   8. D-10 ② 的 npm 账号：NPM_OWNER 必须是合法 npm 用户名，且 docs/08 的 D-10 行
 *      必须原样登记它，防止单点定义与清单分叉（双向咬合）。
 *   9. 3 个发布包的 author 必须与 scope.mjs 的 AUTHOR 单点定义同源
 *      （Aming 2026-11-09 指定留本人邮箱，不用 GitHub 用户名）。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { AUTHOR, NPM_OWNER, REPO_BUGS_URL, REPO_GIT_URL, REPO_WEB_URL } from './scope.mjs';

const repoRoot = resolve(import.meta.dirname, '..');
const coreDir = join(repoRoot, 'packages', 'core');
const strict = process.argv.includes('--strict');
const errors = [];

const read = (abs) => (existsSync(abs) ? readFileSync(abs, 'utf8') : '');
const readJson = (abs) => (existsSync(abs) ? JSON.parse(read(abs)) : {});
const fail = (message) => errors.push(message);

const rootPkg = readJson(join(repoRoot, 'package.json'));
const corePkg = readJson(join(coreDir, 'package.json'));
const changeset = readJson(join(repoRoot, '.changeset', 'config.json'));

// 1. 渠道：公开 npmjs.org 的 scoped 包必须 public，restricted 是私有发布语义
if (changeset.access !== 'public') {
  fail(
    `.changeset/config.json 的 access=${changeset.access}；D-09 已定公开 npmjs.org，必须为 public`,
  );
}

// 2. changeset 里的包名与 workspace 单点来源一致
const workspaceNames = new Set(
  ['core', 'icons', 'tokens'].map(
    (name) => readJson(join(repoRoot, 'packages', name, 'package.json')).name,
  ),
);
const declaredNames = [
  ...(changeset.fixed ?? []).flat(),
  ...(changeset.linked ?? []).flat(),
  ...(changeset.ignore ?? []),
];
for (const name of declaredNames) {
  if (!workspaceNames.has(name)) {
    fail(
      `changeset 声明的包名 "${name}" 不在 workspace 中（正式改名后须同步 .changeset/config.json）`,
    );
  }
}

// 3. release 必须前置严格闸门，且不能排在 publish 之后
const release = String(rootPkg.scripts?.release ?? '');
const gateAt = release.indexOf('check:release --strict');
const publishAt = release.indexOf('changeset publish');
const namingAt = release.indexOf('check:naming');
const buildAt = release.indexOf('pnpm build');
if (gateAt < 0) fail('release 脚本缺少 check:release --strict 前置');
if (publishAt < 0) fail('release 脚本缺少 changeset publish');
if (gateAt >= 0 && publishAt >= 0 && gateAt > publishAt) {
  fail('check:release --strict 必须排在 changeset publish 之前');
}
if (namingAt < 0) fail('release 脚本缺少 check:naming 命名零残留校验');
if (namingAt >= 0 && publishAt >= 0 && namingAt > publishAt) {
  fail('check:naming 必须排在 changeset publish 之前');
}
if (namingAt >= 0 && buildAt >= 0 && namingAt < buildAt) {
  fail('check:naming 必须排在 pnpm build 之后（它要读 dist/styles/index.css）');
}

// 4. 公开内容审计：files 白名单 + npm 强制打包的 package.json（后者不在白名单里）
const scanFiles = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) walk(abs);
    else scanFiles.push(abs);
  }
};
for (const entry of corePkg.files ?? []) {
  const abs = join(coreDir, entry);
  if (!existsSync(abs)) {
    fail(`files 声明的 "${entry}" 不存在`);
    continue;
  }
  if (statSync(abs).isDirectory()) walk(abs);
  else scanFiles.push(abs);
}
if (scanFiles.length === 0) fail('files 展开后为空，公开内容审计形同虚设');

const forbidden = [
  {
    label: '内网 IPv4',
    re: /\b(?:10|127|192\.168|172\.(?:1[6-9]|2\d|3[01]))(?:\.\d{1,3}){3}\b/,
  },
  {
    label: '内网 URL / 域名',
    re: /https?:\/\/[^\s)"']*(?:\.jzeg\.cn|\.ops\.|internal|intranet|localhost)/i,
  },
  { label: '本机绝对路径', re: /(?:\/Users\/|\/home\/|\/root\/)[A-Za-z0-9_.-]+/ },
  {
    label: '疑似凭据',
    re: /(?:password|secret|api[_-]?key|token)\s*[:=]\s*["'][^"']{8,}["']/i,
  },
];
const sensitiveName = /(?:\.env|\.pem$|\.key$|id_rsa|credentials)/i;
const auditFile = (abs, rel) => {
  if (sensitiveName.test(rel)) fail(`公开内容审计：敏感文件 ${rel}`);
  const text = read(abs);
  for (const { label, re } of forbidden) {
    const match = text.match(re);
    if (match) {
      fail(`公开内容审计：${rel} 命中「${label}」→ ${match[0].slice(0, 60)}`);
    }
  }
};
for (const abs of scanFiles) auditFile(abs, abs.slice(coreDir.length + 1));
// npm 会把 package.json 强制打进 tarball，但它不在 files 白名单里 —— 不补这一步，
// 往 package.json 写凭据 / 内网地址就能绕过公开内容审计（2026-11-08 发现的盲区）。
const manifestTargets = [
  ['根 workspace', join(repoRoot, 'package.json')],
  ['core', join(coreDir, 'package.json')],
  ['icons', join(repoRoot, 'packages', 'icons', 'package.json')],
  ['tokens', join(repoRoot, 'packages', 'tokens', 'package.json')],
];
for (const [, abs] of manifestTargets) {
  const rel = abs.slice(repoRoot.length + 1);
  if (!existsSync(abs)) {
    fail(`公开内容审计：发布清单缺失 ${rel}`);
    continue;
  }
  auditFile(abs, rel);
}

// 5. D-01 已定（正式名登记）/ D-10 发布前置资源（strict 的真正阻塞点）
const todo = read(join(repoRoot, 'docs', '08-实施Todo.md'));
const decision = (id) =>
  todo.split('\n').find((line) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(line)) ?? '';
const isChecked = (line) => /\|\s*\[x\]\s*\|\s*$/.test(line);
const d01 = decision('D-01');
const d10 = decision('D-10');
const nameDecided = isChecked(d01);
const resourcesReady = isChecked(d10);
if (d01.length === 0) fail('无法从 docs/08 §0 解析 D-01 行');
if (d10.length === 0) fail('无法从 docs/08 §0 解析 D-10 行（发布前置资源）');
if (strict && !nameDecided) fail('D-01 正式命名未登记，禁止发布');
if (strict && !resourcesReady) {
  fail(
    'D-10 发布前置资源未齐：① GitHub 仓库已由 Aming 2026-11-09 完成首次推送（单 commit / HEAD=origin/main / public 内容审计零命中 / check:public 门禁在位），地址由 scope.mjs 单点定义；② npm 账号 hlskysong 已登记（NPM_OWNER 单点定义），solid-craft / solid-craft-icons / solid-craft-tokens 三个包名在 npmjs.org 只读体检均 404 未占用，但账号存在性与归属未由登录态确证；③ 发布凭据未提供（本机 npm / pnpm whoami 均未登录、.npmrc 无凭据）；④ 0.1.0-canary.* 预演未跑。T1-11 无法闭环，禁止 publish',
  );
}

// 6. 命名零残留：主包名与 llms.txt 必须已经是正式名
if (corePkg.name !== 'solid-craft') {
  fail(`core 包名应为 solid-craft（D-01 正式名），实际 ${corePkg.name}`);
}
const packedIndex = read(join(coreDir, 'llms.txt'));
if (packedIndex.length === 0) fail('包内 llms.txt 缺失，无法校验正式名');
else if (!packedIndex.startsWith('# solid-craft-ui\n')) {
  fail('包内 llms.txt 的 H1 不是正式仓库名 solid-craft-ui');
}

// 7. 发布元数据同源：D-10 ① 的仓库地址只在 scope.mjs 定义一次
const repoMetaTargets = [
  ['根 workspace', join(repoRoot, 'package.json')],
  ['core', join(repoRoot, 'packages', 'core', 'package.json')],
  ['icons', join(repoRoot, 'packages', 'icons', 'package.json')],
  ['tokens', join(repoRoot, 'packages', 'tokens', 'package.json')],
];
for (const [label, abs] of repoMetaTargets) {
  const pkg = readJson(abs);
  if (pkg.repository?.type !== 'git' || pkg.repository?.url !== REPO_GIT_URL) {
    fail(`发布元数据：${label} 的 repository 与 scripts/scope.mjs 单点定义不一致`);
  }
  if (pkg.homepage !== REPO_WEB_URL) {
    fail(`发布元数据：${label} 的 homepage 与 scripts/scope.mjs 单点定义不一致`);
  }
  if (pkg.bugs?.url !== REPO_BUGS_URL) {
    fail(`发布元数据：${label} 的 bugs.url 与 scripts/scope.mjs 单点定义不一致`);
  }
}

// 8. D-10 ② npm 账号：单点定义与 docs/08 登记双向咬合
if (!/^[a-z0-9][a-z0-9._-]*$/.test(NPM_OWNER)) {
  fail(`D-10 ② npm 账号 NPM_OWNER 不是合法 npm 用户名：${NPM_OWNER}`);
}
if (!d10.includes(`\`${NPM_OWNER}\``)) {
  fail(`docs/08 的 D-10 行未登记 scope.mjs 的 npm 账号 \`${NPM_OWNER}\`（单点定义与清单分叉）`);
}

// 9. 发布包 author 同源（只校验会发布的 3 个包；根 workspace 是 private，不强制）
const authorTargets = [
  ['core', join(repoRoot, 'packages', 'core', 'package.json')],
  ['icons', join(repoRoot, 'packages', 'icons', 'package.json')],
  ['tokens', join(repoRoot, 'packages', 'tokens', 'package.json')],
];
for (const [label, abs] of authorTargets) {
  if (readJson(abs).author !== AUTHOR) {
    fail(
      `发布元数据：${label} 的 author 与 scripts/scope.mjs 单点定义不一致（应为 ${String(AUTHOR)}）`,
    );
  }
}

if (errors.length > 0) {
  console.error(`[check:release] ${strict ? '严格' : '常规'}模式 ${errors.length} 项不合规：`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(
  `[check:release] ${strict ? '严格' : '常规'}模式通过：access=public · ${declaredNames.length} 个 changeset 包名与 workspace 一致 · ${scanFiles.length + manifestTargets.length} 个 tarball 文件（含 ${manifestTargets.length} 个 package.json）通过公开内容审计 · release 前置闸门 / check:naming 在位 · ${repoMetaTargets.length} 个 package.json 仓库元数据与 scope.mjs 同源 · npm 账号 ${NPM_OWNER} 与 D-10 登记咬合 · ${authorTargets.length} 个发布包 author 与 scope.mjs 同源 · D-01 ${nameDecided ? '已定（solid-craft-ui / solid-craft / scui-*）' : '未登记'} · D-10 ${resourcesReady ? '已齐' : '未齐（①② 已登记且已推送 / ③④ 待 Aming），release 保持拦截（日常开发不受影响）'}`,
);
