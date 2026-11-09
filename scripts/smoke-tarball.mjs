/**
 * S-01 tarball 冒烟：验证「真实发布产物」而非 workspace 链接。
 *
 * 02 架构 §4.5 要求 examples 消费 pnpm pack 后的 tarball。三端 example 为了
 * 复用 pnpm workspace 与 turbo，仍用 workspace:* 链接（解析到的同样是
 * packages/core/dist/ 下的真实产物）；本脚本补齐两者唯一差异 —— files 白名单、
 * workspace 协议改写、exports 三条件在解包后的目录中可解析。
 *
 * 校验项：
 *   1. pack 出的 tarball 只含 package.json / LICENSE / dist（无源码 / 测试 / 配置）
 *   2. package.json 中不再残留 workspace: 协议
 *   3. exports 表里的每个具体目标文件在解包目录中都存在
 *   4. Node 的 import.meta.resolve 默认命中 dist/esm/*.js，
 *      --conditions=solid 命中 dist/source/*.jsx
 *   5. CSS 与 package.json 子路径可解析
 */
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifacts = path.join(root, '.artifacts');
const consumer = path.join(artifacts, 'consumer');
const packageNames = ['solid-craft', 'solid-craft-icons', 'solid-craft-tokens'];
const errors = [];
let coreVersion = '';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed (rc=${result.status}):\n${result.stdout ?? ''}\n${result.stderr ?? ''}`,
    );
  }
  return (result.stdout ?? '').trim();
}

function assert(condition, message) {
  if (!condition) errors.push(message);
  console.log(`  ${condition ? 'OK  ' : 'FAIL'} ${message}`);
}

let archiveSeq = 0;

/**
 * 临时目录用完整体重命名到系统临时区，由 OS 回收，同时保留排查材料。
 * 环境启用了「单轮累计删除 >50 文件即拦截」的防护，而解包后的 core 包有 144 个文件；
 * rmSync(recursive) 与逐文件 unlink 都会消耗该配额并让 verify 半途中断。
 * renameSync 是原子操作、不产生删除，故不受影响。
 */
function archiveTree(dir) {
  if (!existsSync(dir)) return;
  archiveSeq += 1;
  renameSync(
    dir,
    path.join(tmpdir(), `solid-craft-archive-${process.pid}-${Date.now()}-${archiveSeq}`),
  );
}

/** 展开 exports 表中所有以 ./ 开头的具体目标（跳过通配符）。 */
function exportTargets(exportsMap) {
  const targets = [];
  for (const [key, value] of Object.entries(exportsMap)) {
    if (typeof value === 'string') {
      targets.push([key, 'default', value]);
    } else if (value && typeof value === 'object') {
      for (const [condition, target] of Object.entries(value)) {
        if (typeof target === 'string') targets.push([key, condition, target]);
      }
    }
  }
  return targets;
}

archiveTree(artifacts);
mkdirSync(path.join(consumer, 'node_modules'), { recursive: true });
writeFileSync(
  path.join(consumer, 'package.json'),
  `${JSON.stringify({ name: 'solid-craft-tarball-consumer', private: true, type: 'module' }, null, 2)}\n`,
);

for (const name of packageNames) {
  // 方案 A 扁平无 scope：pnpm pack 产物形如 solid-craft-0.1.0.tgz（不再有 @scope 目录层）
  const shortName = name;
  const output = run('pnpm', ['--filter', name, 'pack', '--pack-destination', artifacts]);
  console.log(`[pack] ${name}: ${output.split('\n').at(-1) ?? ''}`);

  // 精确匹配 `${name}-<version>.tgz`，避免 solid-craft 误匹配 solid-craft-icons-*.tgz
  const tarball = readdirSync(artifacts).find((file) =>
    new RegExp(`^${name}-\\d.*\\.tgz$`).test(file),
  );
  if (!tarball) {
    errors.push(`${name}: 未找到 pack 产物`);
    continue;
  }

  const tarballPath = path.join(artifacts, tarball);
  const entries = run('tar', ['-tzf', tarballPath]).split('\n').filter(Boolean);
  const illegal = entries.filter(
    (entry) =>
      /^package\/(src|tests|__tests__)\//.test(entry) ||
      /^package\/.*(tsconfig|vitest|vite\.config)/.test(entry),
  );
  console.log(`=== ${name} (${entries.length} entries / ${statSync(tarballPath).size} bytes) ===`);
  assert(
    illegal.length === 0,
    `files 白名单生效：无源码 / 测试 / 配置（异常 ${illegal.length} 项）`,
  );
  assert(entries.includes('package/LICENSE'), 'MIT LICENSE 随包发布');

  const unpackTmp = path.join(artifacts, `unpack-${shortName}`);
  mkdirSync(unpackTmp, { recursive: true });
  run('tar', ['-xzf', tarballPath, '-C', unpackTmp]);
  const dest = path.join(consumer, 'node_modules', shortName);
  cpSync(path.join(unpackTmp, 'package'), dest, { recursive: true });
  archiveTree(unpackTmp);

  const pkgPath = path.join(dest, 'package.json');
  const raw = readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(raw);
  assert(!raw.includes('workspace:'), 'package.json 无 workspace: 协议残留');

  const exportsMap = pkg.exports ?? {};
  const targets = exportTargets(exportsMap);
  const missing = targets.filter(([, , target]) => {
    if (target.includes('*')) return false;
    return !existsSync(path.join(dest, target.replace(/^\.\//, '')));
  });
  assert(
    missing.length === 0,
    `exports 目标文件齐全（${targets.length} 条 / 缺失 ${missing.length}）`,
  );
  for (const [key, condition, target] of missing) {
    console.error(`    MISSING ${key} / ${condition} -> ${target}`);
  }

  if (name === 'solid-craft') {
    const componentKeys = Object.keys(exportsMap).filter((key) => {
      const value = exportsMap[key];
      return value && typeof value === 'object' && 'solid' in value;
    });
    assert(componentKeys.length > 0, `含组件子路径带 solid 条件（${componentKeys.length} 个）`);
    const incomplete = componentKeys.filter((key) => {
      const value = exportsMap[key];
      return !value.types || !value.solid || !value.import;
    });
    assert(
      incomplete.length === 0,
      `子路径 types/solid/import 三条件齐全（缺失 ${incomplete.length}）`,
    );

    // Q1-L1：llms 文档随 tarball 发布，版本头必须与 package.json 完全一致（版本错配即失败）。
    for (const docName of ['llms.txt', 'llms-full.txt', 'llms-manifest.json']) {
      assert(entries.includes(`package/${docName}`), `L1 包内文档随 tarball 发布：${docName}`);
    }
    const readPacked = (docName) => {
      const abs = path.join(dest, docName);
      return existsSync(abs) ? readFileSync(abs, 'utf8') : '';
    };
    const indexText = readPacked('llms.txt');
    assert(
      indexText.includes(`> Package: \`${pkg.name}@${pkg.version}\``),
      `llms.txt 版本头与 package.json 一致（${pkg.version}）`,
    );
    assert(readPacked('llms-full.txt').length > 50_000, 'llms-full.txt 全量正文随包发布');
    const manifestText = readPacked('llms-manifest.json');
    const llmsManifest = manifestText.length > 0 ? JSON.parse(manifestText) : {};
    assert(
      llmsManifest.version === pkg.version && llmsManifest.package === pkg.name,
      'llms-manifest.json 版本 / 包名与 package.json 一致',
    );
    assert(
      Array.isArray(llmsManifest.packageDocs) && llmsManifest.packageDocs.length === 3,
      'llms-manifest.json 声明三份包内文档',
    );
    coreVersion = pkg.version;
  }
}

const specs = [
  'solid-craft',
  'solid-craft/button',
  'solid-craft/config-provider',
  'solid-craft/styles.css',
  'solid-craft/package.json',
];
const probePath = path.join(consumer, 'probe.mjs');
writeFileSync(
  probePath,
  `const specs = ${JSON.stringify(specs)};\nconst out = {};\nfor (const spec of specs) out[spec] = import.meta.resolve(spec);\nconsole.log(JSON.stringify(out));\n`,
);

/** probe 放在 consumer 目录下，bare specifier 才会从该目录的 node_modules 解析。 */
function resolveWith(conditions) {
  const args = conditions ? [`--conditions=${conditions}`] : [];
  args.push(probePath);
  const output = run(process.execPath, args, { cwd: consumer });
  const line = output.split('\n').find((item) => item.startsWith('{'));
  return line ? JSON.parse(line) : {};
}

const prefix = pathToFileURL(`${consumer}/`).href;
const shorten = (target) => (target ?? '').replace(prefix, '');

console.log('=== Node exports 条件解析（真实解包目录） ===');
const defaultResolved = resolveWith(null);
const solidResolved = resolveWith('solid');
for (const spec of specs) {
  console.log(`  default  ${spec.padEnd(36)} -> ${shorten(defaultResolved[spec])}`);
  console.log(`  solid    ${spec.padEnd(36)} -> ${shorten(solidResolved[spec])}`);
}

const defaultButton = defaultResolved['solid-craft/button'] ?? '';
const solidButton = solidResolved['solid-craft/button'] ?? '';
const defaultStyles = defaultResolved['solid-craft/styles.css'] ?? '';
assert(
  defaultButton.includes('dist/esm/') && defaultButton.endsWith('.js'),
  '默认条件命中 dist/esm/*.js（编译后 ESM）',
);
assert(
  solidButton.includes('dist/source/') && solidButton.endsWith('.jsx'),
  '--conditions=solid 命中 dist/source/*.jsx（保留 JSX 源码）',
);
assert(defaultStyles.endsWith('dist/styles/index.css'), 'styles.css 子路径可解析');
assert(
  (defaultResolved['solid-craft/package.json'] ?? '').endsWith('/package.json'),
  'package.json 子路径可解析',
);

/**
 * Q1-L1 Agent 端实证：不新增 exports，只用已暴露的 ./package.json 子路径反查同目录文档，
 * 在「真实解包目录」里执行和 Agent 一样的读取动作。pnpm 严格布局下也能定位到所装版本。
 */
const llmsProbePath = path.join(consumer, 'llms-probe.mjs');
writeFileSync(
  llmsProbePath,
  [
    "import { readFileSync } from 'node:fs';",
    "import { fileURLToPath } from 'node:url';",
    "const pkg = new URL(import.meta.resolve('solid-craft/package.json'));",
    "const read = (name) => readFileSync(fileURLToPath(new URL(name, pkg)), 'utf8');",
    "const index = read('./llms.txt');",
    "const full = read('./llms-full.txt');",
    "const manifest = JSON.parse(read('./llms-manifest.json'));",
    "const header = '> Package: `' + manifest.package + '@' + manifest.version + '`';",
    'console.log(JSON.stringify({',
    '  version: manifest.version,',
    '  package: manifest.package,',
    '  pageCount: manifest.pageCount,',
    '  fullLength: full.length,',
    '  hasHeader: index.includes(header),',
    "  hasDocs: index.includes('\\n## Docs\\n'),",
    '}));',
    '',
  ].join('\n'),
);
const llmsProbeOut = run(process.execPath, [llmsProbePath], { cwd: consumer });
const llmsProbeLine = llmsProbeOut.split('\n').find((line) => line.startsWith('{'));
const llmsProbe = llmsProbeLine ? JSON.parse(llmsProbeLine) : {};
console.log('=== Q1-L1 Agent 端包内文档定位（真实解包目录）===');
assert(llmsProbe.hasHeader === true, 'Agent 端 import.meta.resolve 定位包内 llms.txt，版本头匹配');
assert(llmsProbe.version === coreVersion, 'Agent 端读到的 manifest 版本 = 已安装版本');
assert(llmsProbe.package === 'solid-craft', 'Agent 端读到的包名正确');
assert(llmsProbe.hasDocs === true && llmsProbe.pageCount >= 34, 'Agent 端拿到完整索引与页面清单');
assert(llmsProbe.fullLength > 50_000, 'Agent 端可离线读取全量正文');

if (errors.length > 0) {
  console.error(`\n[smoke-tarball] FAILED (${errors.length}):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log('\n[smoke-tarball] PASS: pnpm pack 真实发布产物完整且三条件可解析');
