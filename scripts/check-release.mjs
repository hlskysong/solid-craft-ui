/**
 * 发布闸门（ADR-020 / D-01 / D-09 / D-10）。
 *
 * 背景：2026-11-06 Aming 定了发布渠道 GitHub + 公开 npmjs.org（D-09）；
 * 2026-11-08 Aming 定了正式名（D-01）：仓库 solid-craft-ui、主包 solid-craft、
 * CSS 前缀 scui-*；同日又提供 GitHub 仓库地址（D-10 ①）与 npm 账号 hlskysong（D-10 ②，
 * NPM_OWNER 单点定义，三个扁平包名在 registry.npmjs.org 只读体检均 404 未占用）；
 * 2026-11-09 Aming 本人完成首次推送（单 commit / HEAD=origin/main / public 内容审计零命中）。
 * ③ 发布凭据由交互式 npm login 闭环（npm whoami = hlskysong，凭据仅在用户级 ~/.npmrc，
 * 仓库内零凭据），账号存在性由登录态确证。
 * ④ 经 Aming 2026-11-09 校准：重定义为「本地预演（不 publish）」，由固化的
 * pnpm preview:release 落地实证（docs/08 §27）；同日 Aming 明确授权勾 D-10 主行，
 * --strict 随之放行。⚠️ **放行 ≠ 授权 publish**：真实对外发布仍须 Aming 逐次授权，
 * AI 不得在无人值守流程里调用 pnpm release。
 * 所以本闸门把「发布前置资源」与「预演链路只连本地」钉成机器判据。
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
 *   10. 本地预演链路契约（D-10 ④ 固化）：根 package.json 必须有 preview:release
 *       且入口唯一；registry 只绑 127.0.0.1、网络守卫在位，两个脚本不得出现
 *       公网发布命令 —— 防长期无人值守时脚本漂移成真实 publish。
 *   11. T1-11 受控发布通道：stage:release 入口唯一，脚本唯一发布命令锚点为
 *       npm stage publish，禁止直发命令与凭据字面量（认证必须走 OIDC）。
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
    'D-10 发布前置资源主行不再是 [x]：① GitHub 仓库已由 Aming 2026-11-09 完成首次推送（单 commit / HEAD=origin/main / public 内容审计零命中），地址由 scope.mjs 单点定义；② npm 账号 hlskysong 已登记并由 npm whoami 登录态确证；③ ✅ 发布凭据已闭环（凭据仅存于用户级 ~/.npmrc，仓库内 .npmrc 零凭据）；④ ✅ 本地预演（pnpm preview:release，不 publish）已由 docs/08 §27 实证闭环。若 D-10 被有意撤销，须由 Aming 本人同步文档说明；闸门恢复拦截，禁止 publish',
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

// 10. D-10 ④ 固化链路契约：预演必须只连本地，且不得漂移成公网发布。
//     这是长期无人值守跑任务流时的防漂移闸门（T1-16 的延续）。
const previewEntry = 'node scripts/preview-release.mjs';
if (rootPkg.scripts?.['preview:release'] !== previewEntry) {
  fail(`package.json 缺少 preview:release 或入口不是 ${previewEntry}（D-10 ④ 固化链路）`);
}
const previewMain = read(join(repoRoot, 'scripts', 'preview-release.mjs'));
const previewReg = read(join(repoRoot, 'scripts', 'preview-registry.mjs'));
if (previewMain.length === 0 || previewReg.length === 0) {
  fail('本地预演脚本缺失：scripts/preview-release.mjs / preview-registry.mjs');
} else {
  if (!previewReg.includes("listen(0, '127.0.0.1'")) {
    fail('本地预演 registry 未只绑 127.0.0.1，存在把包发到公网的风险');
  }
  for (const [label, text] of [
    ['preview-release.mjs', previewMain],
    ['preview-registry.mjs', previewReg],
  ]) {
    if (text.includes('changeset publish')) {
      fail(`${label} 含公网发布命令：D-10 ④ 只能本地预演（不 publish）`);
    }
  }
  if (!previewMain.includes('PREVIEW_GUARD_MODE') || !previewMain.includes("'--registry',")) {
    fail('preview-release.mjs 缺少网络守卫或本地 registry 参数（无法证明零公网请求）');
  }
}

// 11. T1-11 受控发布通道：仓库内只允许暂存提交，杜绝把 stage 脚本改成直发。
const stageEntry = 'node scripts/stage-release.mjs';
if (rootPkg.scripts?.['stage:release'] !== stageEntry) {
  fail(`package.json 缺少 stage:release 或入口不是 ${stageEntry}`);
}
const stageScript = read(join(repoRoot, 'scripts', 'stage-release.mjs'));
if (stageScript.length === 0) {
  fail('缺少 scripts/stage-release.mjs（T1-11 受控发布通道）');
} else {
  if (!stageScript.includes("const STAGE_COMMAND = 'npm stage publish'")) {
    fail('stage-release.mjs 的唯一发布命令锚点被改动（只允许暂存提交）');
  }
  if (/\bnpm publish\b|changeset publish/.test(stageScript)) {
    fail('stage-release.mjs 出现直发命令（T1-11 只允许提交暂存队列）');
  }
  if (/NPM_TOKEN|NODE_AUTH_TOKEN|_authToken/.test(stageScript)) {
    fail('stage-release.mjs 出现发布凭据字面量（认证必须走 OIDC）');
  }
}

if (errors.length > 0) {
  console.error(`[check:release] ${strict ? '严格' : '常规'}模式 ${errors.length} 项不合规：`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(
  `[check:release] ${strict ? '严格' : '常规'}模式通过：access=public · ${declaredNames.length} 个 changeset 包名与 workspace 一致 · ${scanFiles.length + manifestTargets.length} 个 tarball 文件（含 ${manifestTargets.length} 个 package.json）通过公开内容审计 · release 前置闸门 / check:naming 在位 · ${repoMetaTargets.length} 个 package.json 仓库元数据与 scope.mjs 同源 · npm 账号 ${NPM_OWNER} 与 D-10 登记咬合 · ${authorTargets.length} 个发布包 author 与 scope.mjs 同源 · D-01 ${nameDecided ? '已定（solid-craft-ui / solid-craft / scui-*）' : '未登记'} · D-10 ${resourcesReady ? '已齐（④ = 本地预演，不 publish；放行 ≠ 授权公网发布）' : '未齐，release 保持拦截'} · T1-11 stage-only 通道在位（禁直发 / 禁 push 自动发包）`,
);
