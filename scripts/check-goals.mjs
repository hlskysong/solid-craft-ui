/**
 * T1-16 / L1 目标冻结：让「目标」与「判据本身」变成机器可验、且改动必须显式的东西。
 *
 * 本项目不是 git 仓库，CODEOWNERS / 分支保护都用不上，所以用 SHA256 基线：
 *   - 受保护：docs/01~07（v0.3 冻结规范）、AGENTS.md（硬约束）、
 *     scripts/scope.mjs（正式名单点）、scripts/naming-legacy.mjs（占位名映射层）、
 *     scripts/check-naming.mjs（命名门禁）、本脚本、check-todo.mjs、todo-governance.json。
 *   - 双向咬合：基线文件自身的 SHA256 写进 AGENTS.md 的标记行；
 *     改受保护文件 → 基线哈希对不上；改基线文件 → AGENTS.md 标记行对不上。
 *     要同时改两处、且两处都在 diff 里显眼才能绕过 —— 这不是防恶意的密码学方案，
 *     而是把「无意识漂移」变成「必须显式执行的人工校准动作」。
 *   - AGENTS.md 的哈希计算排除标记行自身，否则更新基线会无限递归。
 *
 * `node scripts/check-goals.mjs`                 只校验（verify 调用）
 * `node scripts/check-goals.mjs --update-baseline` 人工校准点③：重算基线并同步标记行
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const baselinePath = join(repoRoot, 'scripts', 'goals.baseline.json');
const agentsPath = join(repoRoot, 'AGENTS.md');
const markerPrefix = '> 目标基线 SHA256: ';
const markerRe = /^> 目标基线 SHA256: ([a-f0-9]{64})$/m;
const update = process.argv.includes('--update-baseline');

const sha = (data) => createHash('sha256').update(data).digest('hex');
// 显式比较器：避免 localeCompare 的本地化差异影响保护清单顺序（oxlint 同时要求 compare 参数）
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const readText = (rel) => readFileSync(join(repoRoot, rel), 'utf8');
const readBytes = (rel) => readFileSync(join(repoRoot, rel));

// 标记行替换成固定串后再算 AGENTS.md 的哈希，避免「写标记行 → 哈希变 → 又要写」的循环
const normalizeAgents = (text) => text.replace(markerRe, `${markerPrefix}<HASH>`);

const specDocs = readdirSync(join(repoRoot, 'docs'))
  .filter((name) => /^0[1-7]-.*\.md$/.test(name))
  .toSorted(compare)
  .map((name) => `docs/${name}`);
const protectedFiles = [
  ...specDocs,
  'AGENTS.md',
  'scripts/scope.mjs',
  'scripts/naming-legacy.mjs',
  'scripts/check-naming.mjs',
  'scripts/check-public-repo.mjs',
  'scripts/check-goals.mjs',
  'scripts/check-todo.mjs',
  'scripts/todo-governance.json',
].toSorted(compare);

const fileHash = (rel) =>
  rel === 'AGENTS.md' ? sha(normalizeAgents(readText(rel))) : sha(readBytes(rel));

function buildBaseline() {
  const files = {};
  for (const rel of protectedFiles) files[rel] = fileHash(rel);
  return {
    version: 1,
    generatedAt: new Date().toISOString().slice(0, 10),
    note: '由 pnpm check:goals --update-baseline 生成；受保护文件的任何改动都会让 pnpm verify 失败，改动须人工确认并重跑该命令。',
    files,
  };
}

if (update) {
  if (!markerRe.test(readText('AGENTS.md'))) {
    console.error('[check:goals] AGENTS.md 缺少目标基线标记行，无法安全更新基线');
    process.exit(1);
  }
  const baseline = buildBaseline();
  writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
  const digest = sha(readBytes('scripts/goals.baseline.json'));
  const agents = readText('AGENTS.md').replace(markerRe, `${markerPrefix}${digest}`);
  writeFileSync(agentsPath, agents, 'utf8');
}

const errors = [];
const fail = (message) => errors.push(message);

if (!existsSync(baselinePath)) {
  fail('缺少 scripts/goals.baseline.json，请先跑 pnpm check:goals --update-baseline');
} else {
  const baselineBytes = readBytes('scripts/goals.baseline.json');
  const baseline = JSON.parse(baselineBytes.toString('utf8'));
  const recorded = readText('AGENTS.md').match(markerRe)?.[1];
  if (!recorded) {
    fail('AGENTS.md 缺少目标基线标记行（格式：> 目标基线 SHA256: <64 位十六进制>）');
  } else if (recorded !== sha(baselineBytes)) {
    fail('基线文件已被改动，但 AGENTS.md 的 SHA256 标记行未同步');
  }

  const tracked = Object.keys(baseline.files ?? {}).toSorted(compare);
  const expected = [...protectedFiles].toSorted(compare);
  if (tracked.length !== expected.length || tracked.some((rel, i) => rel !== expected[i])) {
    fail(`基线保护清单被改动：期望 ${expected.length} 个文件，实际 ${tracked.length} 个`);
  }
  for (const rel of protectedFiles) {
    if (!existsSync(join(repoRoot, rel))) {
      fail(`受保护文件缺失：${rel}`);
      continue;
    }
    if (baseline.files?.[rel] !== fileHash(rel)) {
      fail(`受保护文件被改动：${rel}（需人工确认后跑 --update-baseline）`);
    }
  }
}

if (errors.length > 0) {
  console.error(`[check:goals] ${errors.length} 项不合规：`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(
  `[check:goals] ${protectedFiles.length} 个受保护文件 SHA256 与基线一致（docs/01~07 冻结 / AGENTS.md / scope + 映射层 / 三个门禁脚本 / 治理契约）；AGENTS.md 标记行与基线文件咬合一致${update ? ' · 基线已重新校准' : ''}`,
);
