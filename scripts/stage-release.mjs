#!/usr/bin/env node
/**
 * T1-11 受控发布通道：把候选版本提交到 npm 暂存队列，不直接对外发布。
 *
 * 只由 .github/workflows/release.yml 在 workflow_dispatch + environment 审批下调用。
 * 认证来自 npm Trusted Publishing（OIDC 短期凭据），仓库内不存任何凭据。
 * 上线由维护者用 2FA 批准；OIDC 短期凭据无权执行批准命令，CI 无法自己批准自己。
 *
 * 链路：影子 workspace 用 changesets 生成 canary 版本 → 组装仓库外 staging
 *       （改写 workspace 依赖、同步 llms 三件套版本）→ 逐包提交暂存队列。
 * --dry-run 只组装并打印将要执行的命令，不连公网，用于本地验收。
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const tagAt = args.indexOf('--tag');
const tag = tagAt >= 0 ? (args[tagAt + 1] ?? '') : 'canary';
const dryRun = args.includes('--dry-run');
const STAGE_COMMAND = 'npm stage publish';

if (!['canary', 'latest'].includes(tag)) {
  console.error(`[stage:release] --tag 只能是 canary 或 latest，收到 ${tag || '(空)'}`);
  process.exit(1);
}

const npmVersion = execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim();
const [major, minor] = npmVersion.split('.').map(Number);
if (major < 11 || (major === 11 && minor < 15)) {
  console.error(`[stage:release] 暂存发布需要 npm >= 11.15.0，当前 ${npmVersion}`);
  process.exit(1);
}

const stageRoot = process.env.SOLID_CRAFT_STAGE_DIR
  ? resolve(process.env.SOLID_CRAFT_STAGE_DIR)
  : resolve(repoRoot, '..', '.solid-craft-stage');
const dirs = { core: 'solid-craft', icons: 'solid-craft-icons', tokens: 'solid-craft-tokens' };
const versioning = join(stageRoot, 'versioning');
const stagingRoot = join(stageRoot, 'staging');
mkdirSync(join(versioning, '.changeset'), { recursive: true });
mkdirSync(stagingRoot, { recursive: true });
writeFileSync(
  join(versioning, 'package.json'),
  `${JSON.stringify({ name: 'stage-versioning-workspace', private: true, version: '0.0.0' }, null, 2)}\n`,
);
writeFileSync(join(versioning, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"\n');
cpSync(join(repoRoot, '.changeset', 'config.json'), join(versioning, '.changeset', 'config.json'));
for (const dir of Object.keys(dirs)) {
  mkdirSync(join(versioning, 'packages', dir), { recursive: true });
  cpSync(
    join(repoRoot, 'packages', dir, 'package.json'),
    join(versioning, 'packages', dir, 'package.json'),
  );
}

const changesetBin = join(repoRoot, 'node_modules', '.bin', 'changeset');
execFileSync(changesetBin, ['pre', 'enter', 'canary'], { cwd: versioning, stdio: 'inherit' });
// changesets 的 pre 模式必须有一份 changeset 才会产出 prerelease 版本。
writeFileSync(
  join(versioning, '.changeset', 'stage.md'),
  [
    '---',
    '"solid-craft": patch',
    '"solid-craft-icons": patch',
    '"solid-craft-tokens": patch',
    '---',
    '',
    'T1-11 受控发布通道的 canary 版本化（仅存在于仓库外影子 workspace）',
    '',
  ].join('\n'),
);
execFileSync(changesetBin, ['version'], { cwd: versioning, stdio: 'inherit' });
const versions = Object.keys(dirs).map(
  (dir) =>
    JSON.parse(readFileSync(join(versioning, 'packages', dir, 'package.json'), 'utf8')).version,
);
const canary = versions[0] ?? '';
if (!versions.every((value) => value === canary) || !/^0\.1\.\d+-canary\.\d+$/.test(canary)) {
  console.error(`[stage:release] canary 版本异常：${versions.join(' / ')}`);
  process.exit(1);
}

const packages = [];
for (const [dir, name] of Object.entries(dirs)) {
  const src = join(repoRoot, 'packages', dir);
  const dest = join(stagingRoot, name);
  mkdirSync(dest, { recursive: true });
  const manifest = JSON.parse(readFileSync(join(src, 'package.json'), 'utf8'));
  manifest.version = canary;
  for (const [dep, range] of Object.entries(manifest.dependencies ?? {})) {
    if (String(range).startsWith('workspace:')) manifest.dependencies[dep] = canary;
  }
  for (const entry of manifest.files ?? []) {
    const from = join(src, entry);
    if (!existsSync(from)) {
      console.error(
        `[stage:release] ${name} 的 files 条目缺失：${entry}（请先跑 pnpm build / pnpm docs:generate）`,
      );
      process.exit(1);
    }
    cpSync(from, join(dest, entry), { recursive: true });
  }
  if (dir === 'core') {
    const indexPath = join(dest, 'llms.txt');
    writeFileSync(indexPath, readFileSync(indexPath, 'utf8').split('0.1.0').join(canary));
    const manifestPath = join(dest, 'llms-manifest.json');
    const llmsManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    llmsManifest.version = canary;
    writeFileSync(manifestPath, `${JSON.stringify(llmsManifest, null, 2)}\n`);
    const fullPath = join(dest, 'llms-full.txt');
    writeFileSync(fullPath, readFileSync(fullPath, 'utf8').split('0.1.0').join(canary));
  }
  writeFileSync(join(dest, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  if (!existsSync(join(dest, 'LICENSE'))) cpSync(join(src, 'LICENSE'), join(dest, 'LICENSE'));
  packages.push({ name, dest });
}

const stageArgs = [...STAGE_COMMAND.split(' ').slice(1), '--tag', tag, '--access', 'public'];
for (const { name, dest } of packages) {
  console.log(`[stage:release] ${name}@${canary} → ${STAGE_COMMAND} --tag ${tag}`);
  if (dryRun) continue;
  execFileSync('npm', stageArgs, { cwd: dest, stdio: 'inherit' });
}
console.log(
  dryRun
    ? `[stage:release] dry-run 完成：${packages.length} 个包已组装在 ${stagingRoot}，未连公网`
    : `[stage:release] ${packages.length} 个包已进入暂存队列、尚不可安装。维护者查看 npm stage list，并用 2FA 执行 npm stage approve <stage-id>`,
);
