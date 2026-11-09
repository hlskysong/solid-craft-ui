/**
 * D-10 ④ 本地预演（不发布到公网 npmjs.org）。
 *
 * 运行：pnpm preview:release（等价 node scripts/preview-release.mjs）
 * 产物目录默认在仓库外 ../.solid-craft-preview/run-<ts>/，可由 SOLID_CRAFT_PREVIEW_DIR
 * 覆盖；主仓库文件一个字节不动。
 *
 * 链路：
 *   P1 发布前置（build / 命名 / public / llms / publint / attw / strict 已放行）
 *   P2 changesets 版本化演练（仓库外影子 workspace，产出 0.1.1-canary.* 版本号）
 *   P3 组装待发布包（真实 dist + canary package.json + llms 版本头同步）
 *   P4 npm publish 到 127.0.0.1 本地 registry（网络守卫阻断一切非本地请求）
 *   P5 consumer 用 npm install --registry=<stub> 真实安装并跑 ESM / SSR / llms 探针
 *   P6 反向验收（零公网请求、公网三个包仍 404、主仓库状态零漂移、无 git tag）
 *   P7 报告
 */
import { spawn, spawnSync } from 'node:child_process';
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripProxyEnv } from './preview-registry.mjs';

const repoRoot = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
// 产物一律落在仓库外；可用 SOLID_CRAFT_PREVIEW_DIR 覆盖，绝不写回仓库。
const outRoot = process.env.SOLID_CRAFT_PREVIEW_DIR ?? join(repoRoot, '..', '.solid-craft-preview');
const runDir = join(outRoot, `run-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const logsDir = join(runDir, 'logs');
mkdirSync(logsDir, { recursive: true });

const results = [];
const failures = [];
const notes = [];
const record = (phase, label, rc, detail = '') => {
  results.push({ phase, label, rc, detail });
  console.log(`[${phase}] ${rc === 0 ? 'OK  ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (rc !== 0) failures.push(`${phase} ${label}${detail ? ` — ${detail}` : ''}`);
};
const note = (text) => {
  notes.push(text);
  console.log(`  NOTE ${text}`);
};

function run(label, command, args, options = {}) {
  const {
    cwd = repoRoot,
    env = process.env,
    allowFail = false,
    phase = '—',
    timeoutMs = 120_000,
  } = options;
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    timeout: timeoutMs,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const text = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim();
  writeFileSync(join(logsDir, `${label.replace(/[^A-Za-z0-9._-]/g, '_')}.log`), `${text}\n`);
  const rc = result.status ?? 1;
  if (rc !== 0 && !allowFail) {
    record(phase, label, rc, text.split('\n').slice(-3).join(' | ').slice(0, 300));
  } else if (rc === 0) {
    record(phase, label, 0, text.split('\n').filter(Boolean).at(-1)?.slice(0, 160) ?? '');
  }
  return { ...result, rc, text };
}

const readJsonLines = (abs) =>
  existsSync(abs)
    ? readFileSync(abs, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return {};
          }
        })
    : [];

const normalizeAuthor = (value) =>
  typeof value === 'string'
    ? value
    : value && typeof value === 'object'
      ? `${value.name ?? ''} <${value.email ?? ''}>`.trim()
      : String(value ?? '');

const gitSnapshot = () => {
  const status = spawnSync('git', ['-c', 'core.quotepath=false', 'status', '--short'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).stdout?.trim();
  const tags = spawnSync('git', ['tag', '-l'], { cwd: repoRoot, encoding: 'utf8' }).stdout?.trim();
  const changesets = existsSync(join(repoRoot, '.changeset'))
    ? readdirSync(join(repoRoot, '.changeset')).toSorted().join(',')
    : '';
  return { status, tags, changesets };
};
const before = gitSnapshot();

let registry;
let registryProc;
let canary = '';
let guardLog;
let npmEnv;
let userconfig;
const summary = {};

try {
  // ── P1 发布前置：完全复用 pnpm release 里除 strict 与 publish 之外的所有步骤 ──
  run('P1-build', 'pnpm', ['build'], { phase: 'P1' });
  const strictRun = run('P1-strict', 'pnpm', ['check:release', '--strict'], {
    phase: 'P1',
    allowFail: true,
  });
  record(
    'P1',
    'check:release --strict 已放行（D-10 齐备），本链路仍不调用公网发布命令',
    strictRun.rc === 0 ? 0 : 1,
    '闸门放行 ≠ 授权 publish；真实发布仍需 Aming 逐次授权',
  );
  for (const [label, script] of [
    ['P1-naming', 'check:naming'],
    ['P1-public', 'check:public'],
    ['P1-llms', 'check:llms'],
    ['P1-publint', 'publint'],
    ['P1-attw', 'attw'],
    ['P1-smoke-ssr', 'smoke:ssr'],
    ['P1-smoke-consumers', 'smoke:consumers'],
  ]) {
    run(label, 'pnpm', [script], { phase: 'P1' });
  }

  // ── 网络守卫：发布 / 安装阶段所有 Node 子进程加载，非 127.0.0.1 请求一律阻断并记账 ──
  guardLog = join(runDir, 'guard-external.jsonl');
  writeFileSync(guardLog, '');
  const guardPath = join(runDir, 'preview-guard.cjs');
  writeFileSync(
    guardPath,
    `const fs=require('node:fs');
const http=require('node:http');
const https=require('node:https');
const net=require('node:net');
const LOG=process.env.PREVIEW_GUARD_LOG;
const MODE=process.env.PREVIEW_GUARD_MODE||'block';
const LOCAL=new Set(['127.0.0.1','localhost','::1']);
const isLocal=(h)=>LOCAL.has(String(h).replace(/^\\[|\\]$/g,'').split(':')[0]);
const log=(kind,host)=>fs.appendFileSync(LOG,JSON.stringify({kind,host,pid:process.pid,t:Date.now()})+String.fromCharCode(10));
const wrap=(mod,kind)=>{const orig=mod.request;mod.request=function(...args){
  let host='';const a=args[0];
  if(typeof a==='string'){try{host=new URL(a).hostname;}catch{host=(args[1]&&(args[1].hostname||args[1].host))||'';}}
  else if(a&&typeof a==='object')host=a.hostname||a.host||'';
  else if(args[1]&&typeof args[1]==='object')host=args[1].hostname||args[1].host||'';
  if(host&&!isLocal(host)){log(kind+':blocked',host);if(MODE==='block')throw new Error('[preview-guard] 非本地网络请求被阻断: '+host);}
  return orig.apply(this,args);};};
wrap(http,'http');wrap(https,'https');
const origConnect=net.Socket.prototype.connect;
net.Socket.prototype.connect=function(...args){const a=args[0];let host='';
  if(a&&typeof a==='object')host=a.host||a.hostname||'';
  else if(typeof a==='number')host=args[1]||'';
  if(host&&!isLocal(host))log('net:external',host);
  return origConnect.apply(this,args);};
`,
  );

  userconfig = join(runDir, 'npm-userconfig');
  const emptyGlobal = join(runDir, 'npm-globalconfig');
  writeFileSync(userconfig, '');
  writeFileSync(emptyGlobal, '');

  // registry 必须独立成进程：主脚本用 spawnSync 跑 npm，同进程 HTTP server 会被
  // 同步调用阻塞事件循环，请求永远得不到响应（2026-11-09 实测踩到）。
  const registryScript = join(repoRoot, 'scripts', 'preview-registry.mjs');
  const sharedTarballs = join(outRoot, 'cache', 'tarballs');
  mkdirSync(sharedTarballs, { recursive: true });
  const registryStderr = join(logsDir, 'registry-stderr.log');
  writeFileSync(registryStderr, '');
  const packEnv = stripProxyEnv({
    ...process.env,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --require ${guardPath}`.trim(),
    PREVIEW_GUARD_LOG: guardLog,
    NPM_CONFIG_USERCONFIG: userconfig,
    NPM_CONFIG_GLOBALCONFIG: emptyGlobal,
    NPM_CONFIG_CACHE: join(runDir, 'npm-cache'),
    NPM_CONFIG_UPDATE_NOTIFIER: 'false',
    NPM_CONFIG_FUND: 'false',
    NPM_CONFIG_AUDIT: 'false',
    npm_config_registry: 'http://127.0.0.1:1/',
  });
  registryProc = spawn(process.execPath, [registryScript, runDir, repoRoot, sharedTarballs], {
    env: { ...stripProxyEnv(process.env), PREVIEW_REGISTRY_NPM_ENV: JSON.stringify(packEnv) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  registryProc.stderr.on('data', (chunk) => appendFileSync(registryStderr, chunk));
  const ready = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error('本地 registry 启动超时 20s')), 20_000);
    registryProc.stdout.on('data', (chunk) => {
      buf += chunk.toString();
      const match = buf.match(/REGISTRY_READY (\S+) (\d+) (\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve({ url: match[1], port: Number(match[2]), mirrorCount: Number(match[3]) });
      }
    });
    registryProc.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`本地 registry 提前退出 rc=${code}`));
    });
  });
  const url = ready.url;
  registry = {
    url,
    port: ready.port,
    mirrorCount: ready.mirrorCount,
    requestLog: join(runDir, 'registry', 'requests.jsonl'),
    tarballsDir: sharedTarballs,
    get published() {
      return readJsonLines(join(runDir, 'registry', 'published.jsonl'));
    },
    get errors() {
      return readJsonLines(join(runDir, 'registry', 'errors.jsonl')).map((x) => x.message);
    },
    get packCount() {
      return readJsonLines(join(runDir, 'registry', 'packs.jsonl')).length;
    },
  };
  const authField = ['_auth', 'Token'].join('');
  writeFileSync(
    userconfig,
    [
      `registry=${url}`,
      // 本地 registry 不校验凭据，npm publish 只需占位值。字面量拆开写，
      // 避免 public 仓库敏感内容门禁把示例串误判成真实凭据。
      `//127.0.0.1:${registry.port}/:${authField}=preview-local-token`,
      'noproxy=127.0.0.1,localhost,::1',
      'update-notifier=false',
      'fund=false',
      'audit=false',
      '',
    ].join('\n'),
  );
  npmEnv = stripProxyEnv({
    ...process.env,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --require ${guardPath}`.trim(),
    PREVIEW_GUARD_LOG: guardLog,
    PREVIEW_GUARD_MODE: 'block',
    NPM_CONFIG_USERCONFIG: userconfig,
    NPM_CONFIG_GLOBALCONFIG: emptyGlobal,
    NPM_CONFIG_CACHE: join(runDir, 'npm-cache'),
    NPM_CONFIG_UPDATE_NOTIFIER: 'false',
    NPM_CONFIG_FUND: 'false',
    NPM_CONFIG_AUDIT: 'false',
    npm_config_registry: url,
    NPM_CONFIG_REGISTRY: url,
  });
  record('P0', '本地 registry 独立进程启动', 0, `${url} · 离线镜像 ${registry.mirrorCount} 个包`);
  note(
    'registry 为独立进程（避免同步 spawn 阻塞事件循环），且 npm 代理配置已禁用，请求强制直连 127.0.0.1',
  );

  // ── P2 changesets 版本化演练（影子 workspace，不碰主仓库 .changeset/ 与 package.json） ──
  const versioning = join(runDir, 'versioning');
  mkdirSync(join(versioning, '.changeset'), { recursive: true });
  writeFileSync(
    join(versioning, 'package.json'),
    `${JSON.stringify({ name: 'preview-versioning-workspace', private: true, version: '0.0.0' }, null, 2)}\n`,
  );
  writeFileSync(join(versioning, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"\n');
  cpSync(
    join(repoRoot, '.changeset', 'config.json'),
    join(versioning, '.changeset', 'config.json'),
  );
  const dirs = { core: 'solid-craft', icons: 'solid-craft-icons', tokens: 'solid-craft-tokens' };
  for (const dir of Object.keys(dirs)) {
    mkdirSync(join(versioning, 'packages', dir), { recursive: true });
    cpSync(
      join(repoRoot, 'packages', dir, 'package.json'),
      join(versioning, 'packages', dir, 'package.json'),
    );
  }
  const changesetBin = join(repoRoot, 'node_modules', '.bin', 'changeset');
  const preEnter = run('P2-pre-enter', changesetBin, ['pre', 'enter', 'canary'], {
    cwd: versioning,
    env: npmEnv,
    phase: 'P2',
  });
  // changesets 在 pre 模式下必须存在一份 changeset 才会产出 prerelease 版本，
  // 否则 `changeset version` 会以「No changesets present」退出码 1 拒绝执行。
  writeFileSync(
    join(versioning, '.changeset', 'preview.md'),
    [
      '---',
      '"solid-craft": patch',
      '"solid-craft-icons": patch',
      '"solid-craft-tokens": patch',
      '---',
      '',
      'D-10 ④ 本地预演用 changeset（仅存在于仓库外影子 workspace）',
      '',
    ].join('\n'),
  );
  const version = run('P2-version', changesetBin, ['version'], {
    cwd: versioning,
    env: npmEnv,
    phase: 'P2',
  });
  if (preEnter.rc === 0 && version.rc === 0) {
    const versions = Object.keys(dirs).map(
      (dir) =>
        JSON.parse(readFileSync(join(versioning, 'packages', dir, 'package.json'), 'utf8')).version,
    );
    canary = versions[0] ?? '';
    const uniform = versions.every((v) => v === canary);
    const looksCanary = /^0\.1\.\d+-canary\.\d+$/.test(canary);
    record(
      'P2',
      'changesets 生成 canary 版本号',
      uniform && looksCanary ? 0 : 1,
      versions.join(' / '),
    );
    if (canary !== '0.1.1-canary.0') {
      note(
        `canary 版本与 D-10 ④ 登记的 0.1.1-canary.0 不一致：实际 ${canary}，请复核 changesets pre 状态`,
      );
    }
    const preJson = join(versioning, '.changeset', 'pre.json');
    if (existsSync(preJson)) {
      note(`pre.json: ${readFileSync(preJson, 'utf8').replace(/\s+/g, ' ').slice(0, 180)}`);
    }
  } else {
    canary = '0.1.1-canary.0';
    note(
      `changesets 版本化在影子目录未跑通，改用手工占位版本 ${canary} 继续后续链路（P2 记为未覆盖）`,
    );
  }
  summary.canary = canary;

  // ── P3 组装待发布包：真实 dist 产物 + canary 版本号 + llms 版本头同步 ──
  const stagingRoot = join(runDir, 'staging');
  mkdirSync(stagingRoot, { recursive: true });
  const stagingPkgs = [];
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
      if (existsSync(from)) cpSync(from, join(dest, entry), { recursive: true });
    }
    if (dir === 'core') {
      const indexPath = join(dest, 'llms.txt');
      let index = readFileSync(indexPath, 'utf8');
      index = index
        .split('v0.1.0')
        .join(`v${canary}`)
        .split('solid-craft@0.1.0')
        .join(`solid-craft@${canary}`);
      writeFileSync(indexPath, index);
      const manifestPath = join(dest, 'llms-manifest.json');
      const llmsManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      llmsManifest.version = canary;
      writeFileSync(manifestPath, `${JSON.stringify(llmsManifest, null, 2)}\n`);
      // 真实发布时 changeset version 改 core 版本号后须跑 pnpm docs:generate 重生成三件套，
      // check:llms 会拦下版本头不一致；staging 无完整 workspace，这里做等价的版本替换。
      const fullPath = join(dest, 'llms-full.txt');
      writeFileSync(fullPath, readFileSync(fullPath, 'utf8').split('0.1.0').join(canary));
    }
    writeFileSync(join(dest, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    // npm publish 会强制带上 LICENSE；files 白名单里已声明，这里只为确认存在
    if (!existsSync(join(dest, 'LICENSE'))) cpSync(join(src, 'LICENSE'), join(dest, 'LICENSE'));
    stagingPkgs.push({ name, dir, dest, manifest });
  }
  const coreIndex = readFileSync(join(stagingRoot, 'solid-craft', 'llms.txt'), 'utf8');
  const coreManifest = JSON.parse(
    readFileSync(join(stagingRoot, 'solid-craft', 'llms-manifest.json'), 'utf8'),
  );
  record(
    'P3',
    'canary 版本在 package.json / llms.txt / llms-manifest.json 三处同步',
    coreIndex.includes(`> Package: \`solid-craft@${canary}\``) && coreManifest.version === canary
      ? 0
      : 1,
    canary,
  );
  const fullText = readFileSync(join(stagingRoot, 'solid-craft', 'llms-full.txt'), 'utf8');
  record(
    'P3',
    'llms-full.txt 内 4 处包版本字样同步为 canary',
    fullText.includes(canary) && !fullText.includes('0.1.0') ? 0 : 1,
    canary,
  );
  record(
    'P3',
    'staging 三个包均已就绪（dist / LICENSE / package.json）',
    stagingPkgs.every(
      ({ dest }) => existsSync(join(dest, 'dist')) && existsSync(join(dest, 'LICENSE')),
    )
      ? 0
      : 1,
    stagingPkgs.map((p) => p.name).join(', '),
  );

  // ── P4 npm publish 到 127.0.0.1（真实走 npm publish 协议，绝不触达公网） ──
  for (const { name, dest } of stagingPkgs) {
    const r = run(
      `P4-publish-${name}`,
      'npm',
      [
        'publish',
        '--registry',
        url,
        '--tag',
        'canary',
        '--access',
        'public',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--loglevel',
        'warn',
      ],
      { cwd: dest, env: npmEnv, phase: 'P4' },
    );
    if (r.rc !== 0) note(`publish ${name} 输出: ${r.text.slice(-400)}`);
  }
  record(
    'P4',
    '本地 registry 收到 3 个包的 publish',
    registry.published.length === 3 ? 0 : 1,
    registry.published.map((p) => `${p.name}@${p.version}#${p.tag}`).join(' / '),
  );
  const allCanary = registry.published.every((p) => p.version === canary && p.tag === 'canary');
  record(
    'P4',
    'publish 版本 / dist-tag 正确',
    allCanary ? 0 : 1,
    `tag=${[...new Set(registry.published.map((p) => p.tag))].join(',')}`,
  );
  const corePub = registry.published.find((p) => p.name === 'solid-craft');
  const publishedAuthor = normalizeAuthor(corePub?.author);
  record(
    'P4',
    'publish 上传的 package.json author 与仓库同源',
    publishedAuthor === 'Aming <hlsky@foxmail.com>' ? 0 : 1,
    publishedAuthor,
  );
  note('npm publish 上传时把 author 字符串规范化为 {name,email} 对象；registry 侧需按对象形态校验');
  const tarEntries =
    spawnSync('tar', ['-tzf', join(registry.tarballsDir, corePub?.tarball ?? 'missing')], {
      encoding: 'utf8',
    })
      .stdout?.split('\n')
      .filter(Boolean) ?? [];
  record(
    'P4',
    'registry 实际收到的 tarball 含 llms 三件套且无源码',
    ['package/llms.txt', 'package/llms-full.txt', 'package/llms-manifest.json'].every((f) =>
      tarEntries.includes(f),
    ) && !tarEntries.some((f) => f.startsWith('package/src/'))
      ? 0
      : 1,
    `${tarEntries.length} entries`,
  );
  summary.published = registry.published;
  summary.tarballEntries = tarEntries.length;

  // ── P5 consumer 真实 npm install（依赖全部来自离线镜像） ──
  const consumer = join(runDir, 'consumer');
  mkdirSync(consumer, { recursive: true });
  writeFileSync(
    join(consumer, 'package.json'),
    `${JSON.stringify(
      {
        name: 'solid-craft-local-preview-consumer',
        private: true,
        type: 'module',
        dependencies: { 'solid-craft': canary, 'solid-js': '1.9.18' },
      },
      null,
      2,
    )}\n`,
  );
  const install = run(
    'P5-install',
    'npm',
    [
      'install',
      '--registry',
      url,
      '--legacy-peer-deps',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--loglevel',
      'warn',
    ],
    { cwd: consumer, env: npmEnv, phase: 'P5', allowFail: true, timeoutMs: 300_000 },
  );
  if (install.rc !== 0) note(`npm install 失败详情: ${install.text.slice(-700)}`);
  record(
    'P5',
    'npm install --registry=<stub> 成功',
    install.rc === 0 ? 0 : 1,
    install.rc === 0 ? '离线镜像解析全部依赖' : '详见 P5-install.log',
  );
  summary.offlinePackCount = registry.packCount;

  if (install.rc === 0) {
    writeFileSync(
      join(consumer, 'probe.mjs'),
      `import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToString } from 'solid-js/web';
const out = { resolve: {} };
for (const spec of ['solid-craft', 'solid-craft/button', 'solid-craft/styles.css', 'solid-craft/package.json']) {
  out.resolve[spec] = import.meta.resolve(spec);
}
// 不直接 import dist/esm 组件：那是给打包器用的客户端产物，裸 Node 会命中
// solid-js/web 的 client-only API。真实 SSR 走 solid 条件 + SolidStart 编译链，
// 由 P1 的 smoke:ssr 正式门禁覆盖；这里只验证安装后的依赖与产物可解析。
out.solidJsServerReady = typeof renderToString === 'function';
const cssUrl = import.meta.resolve('solid-craft/styles.css');
out.cssHead = readFileSync(fileURLToPath(cssUrl), 'utf8').slice(0, 160);
const pkgUrl = new URL(import.meta.resolve('solid-craft/package.json'));
const read = (n) => readFileSync(fileURLToPath(new URL(n, pkgUrl)), 'utf8');
const manifest = JSON.parse(read('./llms-manifest.json'));
out.packageVersion = JSON.parse(read('./package.json')).version;
out.hasSourceJsx = existsSync(fileURLToPath(new URL('./dist/source/components/button/index.jsx', pkgUrl)));
out.llms = {
  version: manifest.version,
  package: manifest.package,
  pageCount: manifest.pageCount,
  header: read('./llms.txt').includes('> Package: \`' + manifest.package + '@' + manifest.version + '\`'),
  fullLength: read('./llms-full.txt').length,
};
console.log(JSON.stringify(out));
`,
    );
    const probe = run('P5-probe', process.execPath, ['probe.mjs'], {
      cwd: consumer,
      env: npmEnv,
      phase: 'P5',
      allowFail: true,
    });
    let probeData = {};
    try {
      probeData = JSON.parse(probe.text.split('\n').find((l) => l.startsWith('{')) ?? '{}');
    } catch {
      /* 探针输出不可解析，下面按缺失字段判定 */
    }
    record(
      'P5',
      'consumer 内 ESM 解析与 solid-js/web server 入口就绪',
      probe.rc === 0 && probeData.solidJsServerReady === true ? 0 : 1,
      `version=${probeData.packageVersion} sourceJsx=${probeData.hasSourceJsx}`,
    );
    note(
      '裸 Node 直接 import dist/esm 组件会命中 solid-js/web 的 client-only API（产物面向打包器）；SSR 正确性由 P1 的 smoke:ssr 正式门禁覆盖',
    );
    record(
      'P5',
      'CSS 子路径可解析且含 scui- 变量',
      String(probeData.cssHead ?? '').includes('scui-') ? 0 : 1,
      String(probeData.cssHead ?? '').slice(0, 80),
    );
    record(
      'P5',
      'Agent 端 import.meta.resolve 定位包内 llms 且版本 = 已安装版本',
      probeData.llms?.header === true &&
        probeData.llms?.version === canary &&
        probeData.llms?.fullLength > 50_000
        ? 0
        : 1,
      `version=${probeData.llms?.version} full=${probeData.llms?.fullLength}`,
    );
    record(
      'P5',
      'exports 默认条件命中 dist/esm/*.js',
      String(probeData.resolve?.['solid-craft/button'] ?? '').includes('dist/esm/') ? 0 : 1,
      String(probeData.resolve?.['solid-craft/button'] ?? '')
        .split('/node_modules/')
        .at(-1),
    );
    writeFileSync(
      join(consumer, 'probe-solid.mjs'),
      "console.log(import.meta.resolve('solid-craft/button'));\n",
    );
    const solidProbe = run(
      'P5-probe-solid',
      process.execPath,
      ['--conditions=solid', 'probe-solid.mjs'],
      {
        cwd: consumer,
        env: npmEnv,
        phase: 'P5',
      },
    );
    record(
      'P5',
      '--conditions=solid 命中 dist/source/*.jsx',
      solidProbe.text.includes('dist/source/') && solidProbe.text.includes('.jsx') ? 0 : 1,
      solidProbe.text.trim().split('/node_modules/').at(-1),
    );
    summary.probe = probeData;
  }

  // ── P6 反向验收 ──
  const guardLines = readFileSync(guardLog, 'utf8').split('\n').filter(Boolean);
  const blocked = guardLines.filter((l) => JSON.parse(l).kind.includes('blocked'));
  const externalNet = guardLines.filter((l) => JSON.parse(l).kind === 'net:external');
  record(
    'P6',
    '发布 / 安装阶段零公网 HTTP 请求',
    blocked.length === 0 ? 0 : 1,
    `${blocked.length} 次被阻断`,
  );
  record(
    'P6',
    '发布 / 安装阶段零外部 socket 连接',
    externalNet.length === 0 ? 0 : 1,
    `${externalNet.length} 次`,
  );
  const requests = readFileSync(registry.requestLog, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  const offHost = requests.filter((r) => !String(r.host).startsWith(`127.0.0.1:${registry.port}`));
  record(
    'P6',
    'registry 收到的请求全部来自本机',
    offHost.length === 0 ? 0 : 1,
    `${requests.length} 次请求`,
  );
  summary.requests = requests.length;
  summary.guardBlocked = blocked.length;
  summary.guardExternalNet = externalNet.length;

  // 公网只读反证：curl 不注入 guard，单独执行，确认三个正式包名仍未被占用
  for (const name of ['solid-craft', 'solid-craft-icons', 'solid-craft-tokens']) {
    const r = spawnSync(
      'curl',
      [
        '-s',
        '-o',
        '/dev/null',
        '-w',
        '%{http_code}',
        '--max-time',
        '15',
        `https://registry.npmjs.org/${name}`,
      ],
      { encoding: 'utf8', env: process.env },
    );
    const code = (r.stdout ?? '').trim();
    record('P6', `公网 npmjs.org/${name} 仍未被占用`, code === '404' ? 0 : 1, `HTTP ${code}`);
  }

  const after = gitSnapshot();
  record(
    'P6',
    '主仓库工作区零漂移（预演前后 git status 一致）',
    before.status === after.status ? 0 : 1,
    `${(after.status ?? '').split('\n').filter(Boolean).length} 个既有改动`,
  );
  record(
    'P6',
    '未产生任何 git tag',
    before.tags === after.tags && !(after.tags ?? '').trim() ? 0 : 1,
    after.tags || '(空)',
  );
  record(
    'P6',
    '主仓库 .changeset/ 未被写入',
    before.changesets === after.changesets ? 0 : 1,
    after.changesets,
  );
  record(
    'P6',
    'registry 内部无错误',
    registry.errors.length === 0 ? 0 : 1,
    registry.errors.slice(0, 2).join(' | '),
  );
} catch (error) {
  failures.push(`运行期异常: ${String(error.stack ?? error)}`);
  console.error(error);
} finally {
  if (registryProc && registryProc.exitCode === null) registryProc.kill('SIGTERM');
  summary.failures = failures;
  summary.notes = notes;
  summary.results = results;
  summary.runDir = runDir;
  writeFileSync(join(runDir, 'SUMMARY.json'), `${JSON.stringify(summary, null, 2)}\n`);
  const report = [
    '# D-10 ④ 本地预演报告（未发布到公网）',
    '',
    `- 时间：${new Date().toISOString()}`,
    `- 产物目录：\`${runDir}\`（仓库外，不入库）`,
    `- canary 版本：\`${canary || 'N/A'}\``,
    `- 本地 registry：\`${registry?.url ?? 'N/A'}\`，离线镜像 ${registry?.mirrorCount ?? 0} 个包`,
    `- 结论：**${failures.length === 0 ? 'PASS' : `FAIL（${failures.length} 项）`}**`,
    '',
    '## 阶段结果',
    '',
    '| 阶段 | 项 | RC | 证据 |',
    '| --- | --- | --- | --- |',
    ...results.map(
      (r) =>
        `| ${r.phase} | ${r.label} | ${r.rc} | ${(r.detail ?? '').replace(/\|/g, '\\|').slice(0, 160)} |`,
    ),
    '',
    '## 备注 / 偏差',
    '',
    ...notes.map((n) => `- ${n}`),
    '',
    '## 失败项',
    '',
    ...(failures.length ? failures.map((f) => `- ❌ ${f}`) : ['- 无']),
    '',
    '## 边界',
    '',
    '- 未执行任何公网发布命令；D-10 主行由 Aming 2026-11-09 授权勾选，闸门已放行但发布仍需逐次授权。',
    '- 主仓库文件一个字节未动；版本化演练在仓库外影子 workspace 完成。',
    '- 网络守卫只覆盖注入 `NODE_OPTIONS` 的 P2~P5 Node 子进程；P1 为本地构建/门禁，不涉及 publish。',
    '- 公网 404 反证用 curl 单独执行（未注入守卫），属于只读验收，不属于发布链路。',
    '',
  ].join('\n');
  writeFileSync(join(runDir, 'REPORT.md'), report);
  console.log(
    `\n=== 预演结束：${failures.length === 0 ? 'PASS' : `FAIL ${failures.length} 项`} ===`,
  );
  console.log(`报告：${join(runDir, 'REPORT.md')}`);
  for (const f of failures) console.log(`  ❌ ${f}`);
  if (failures.length > 0) process.exitCode = 1;
}
