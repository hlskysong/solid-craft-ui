/**
 * T1-07 / S-09：TS 7 原生二进制平台包门禁（06 §2.1 / ADR-017 / 01 §9）。
 *
 * 这个脚本在 CI 的每个架构 job 里单独运行，不需要先 build。判据：
 *   1. typescript 的 optionalDependencies 列出全部平台二进制包；
 *   2. pnpm-lock.yaml 为每个平台包都写了固定版本条目（registry 少镜像一个包，在 lock 层就暴露）；
 *   3. 当前平台对应的二进制包在 node_modules 里真实安装（不是只写在 lock 里）；
 *   4. 用 Node 直接执行 typescript/bin/tsc --version 且版本匹配（跨平台，
 *      不依赖 .bin/tsc 在 Windows 上是 .cmd 还是 shell 脚本）；
 *   5. .node-version 满足根 engines.node，避免 CI 悄悄跑在不受支持的 Node 上。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const errors = [];
const read = (abs) => (existsSync(abs) ? readFileSync(abs, 'utf8') : '');
const fail = (message) => errors.push(message);

const rootPkg = JSON.parse(read(join(repoRoot, 'package.json')));
const tsPkgPath = join(repoRoot, 'node_modules', 'typescript', 'package.json');
if (!existsSync(tsPkgPath)) {
  console.error('[check:platforms] 未安装 typescript，先跑 pnpm install --frozen-lockfile');
  process.exit(1);
}
const tsPkg = JSON.parse(read(tsPkgPath));
const tsVersion = tsPkg.version;
const platformPkgs = Object.entries(tsPkg.optionalDependencies ?? {}).filter(([name]) =>
  name.startsWith('@typescript/typescript-'),
);

if (platformPkgs.length < 20) {
  fail(`typescript@${tsVersion} 只声明 ${platformPkgs.length} 个平台包（规范要求 20 个）`);
}

const lock = read(join(repoRoot, 'pnpm-lock.yaml'));
const missingInLock = platformPkgs.filter(([name]) => !lock.includes(name)).map(([name]) => name);
if (missingInLock.length > 0) {
  fail(`pnpm-lock.yaml 缺 ${missingInLock.length} 个 TS 平台包：${missingInLock.join(', ')}`);
}
const missingVersion = platformPkgs
  .filter(([name, version]) => !lock.includes(`${name}@${version}`))
  .map(([name, version]) => `${name}@${version}`);
if (missingVersion.length > 0) {
  fail(
    `平台包版本未锁定：${missingVersion.slice(0, 4).join(', ')}（共 ${missingVersion.length} 个）`,
  );
}

const platformId = `${process.platform}-${process.arch}`;
const currentPkg = `@typescript/typescript-${platformId}`;
if (!platformPkgs.some(([name]) => name === currentPkg)) {
  fail(`当前平台 ${platformId} 不在 TS 7 平台包清单内（CI 架构需与可用平台包对齐）`);
}

const pnpmDir = join(repoRoot, 'node_modules', '.pnpm');
const installedInPnpm =
  existsSync(pnpmDir) &&
  readdirSync(pnpmDir).some((dir) => dir.startsWith(`@typescript+typescript-${platformId}@`));
const installedFlat = existsSync(
  join(repoRoot, 'node_modules', '@typescript', `typescript-${platformId}`, 'package.json'),
);
if (!installedInPnpm && !installedFlat) {
  fail(`当前平台二进制包未安装：${currentPkg}（安装成功但构建会报 Unable to resolve ...）`);
}

const tscBin = join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');
if (!existsSync(tscBin)) {
  fail('typescript/bin/tsc 不存在');
} else {
  const output = execFileSync(process.execPath, [tscBin, '--version'], { encoding: 'utf8' });
  if (!output.includes(tsVersion)) {
    fail(`tsc --version 输出 "${output.trim()}"，期望包含 ${tsVersion}`);
  }
}

const nodeVersion = read(join(repoRoot, '.node-version')).trim();
const engine = rootPkg.engines?.node ?? '';
const minMatch = engine.match(/^>=\s*(\d+)\.(\d+)\.(\d+)$/);
const atLeast = (version, minimum) => {
  const left = version.split('.').map(Number);
  for (let index = 0; index < minimum.length; index += 1) {
    const a = left[index] ?? 0;
    const b = minimum[index] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return true;
};
if (!/^\d+\.\d+\.\d+$/.test(nodeVersion)) {
  fail(`.node-version 内容非法："${nodeVersion}"`);
} else if (
  minMatch &&
  !atLeast(nodeVersion, [Number(minMatch[1]), Number(minMatch[2]), Number(minMatch[3])])
) {
  fail(`.node-version ${nodeVersion} 不满足根 engines.node ${engine}`);
}

if (errors.length > 0) {
  console.error(`[check:platforms] ${errors.length} 项不合规：`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(
  `[check:platforms] TS ${tsVersion} · ${platformPkgs.length}/${platformPkgs.length} 平台包已锁定进 lockfile · ${currentPkg} 已安装 · tsc --version 通过 · .node-version ${nodeVersion} 满足 engines ${engine}`,
);
