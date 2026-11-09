/**
 * 本地预演专用 registry（D-10 ④ 固化链路，不依赖网络、无上游代理）。
 *
 * 能力：
 *   1. 只监听 127.0.0.1 的随机端口，接受 npm publish 的 PUT /<name>，把 tarball 落盘；
 *   2. 把主仓库 node_modules/.pnpm 里已安装的依赖注册成离线 packument，
 *      按需用 npm pack 生成 tarball，使 consumer 可以真正执行 `npm install --registry=<stub>`；
 *   3. 记录全部请求（host 脱敏），供「发布阶段零公网请求」验收。
 *
 * 这不是 verdaccio：没有上游代理，任何未登记的包一律 404，因此不可能把包发到公网。
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * npm 会读取 HTTP(S)_PROXY / ~/.npmrc 的 proxy 配置；本机 WorkBuddy 代理会把
 * 127.0.0.1 的 registry 请求转成 502 并反复重试。预演必须强制直连本地。
 */
export function stripProxyEnv(base = process.env) {
  const env = { ...base };
  for (const key of [
    'HTTP_PROXY',
    'HTTPS_PROXY',
    'http_proxy',
    'https_proxy',
    'ALL_PROXY',
    'all_proxy',
  ]) {
    delete env[key];
  }
  env.NO_PROXY = '127.0.0.1,localhost,::1';
  env.no_proxy = '127.0.0.1,localhost,::1';
  env.npm_config_noproxy = '127.0.0.1,localhost,::1';
  env.npm_config_proxy = '';
  env.npm_config_https_proxy = '';
  return env;
}

const json = (res, code, value) => {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(value));
};

const decodeName = (urlPath) => {
  const raw = urlPath.replace(/^\//, '').replace(/\?.*$/, '');
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const compareVersion = (a, b) => {
  const pa = String(a)
    .split(/[.-]/)
    .map((x) => (/^\d+$/.test(x) ? Number(x) : 0));
  const pb = String(b)
    .split(/[.-]/)
    .map((x) => (/^\d+$/.test(x) ? Number(x) : 0));
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
};

export async function startRegistry({
  runDir,
  repoRoot,
  envForNpm,
  tarballsDir: tarballsOverride,
}) {
  const tarballsDir = tarballsOverride ?? join(runDir, 'registry', 'tarballs');
  mkdirSync(tarballsDir, { recursive: true });
  mkdirSync(join(runDir, 'registry'), { recursive: true });
  const requestLog = join(runDir, 'registry', 'requests.jsonl');
  const publishedLog = join(runDir, 'registry', 'published.jsonl');
  const errorsLog = join(runDir, 'registry', 'errors.jsonl');
  const packsLog = join(runDir, 'registry', 'packs.jsonl');
  for (const file of [requestLog, publishedLog, errorsLog, packsLog]) writeFileSync(file, '');
  // 独立进程模式下父进程靠这些文件读取结果，避免同进程 spawnSync 阻塞 HTTP 事件循环。
  const pushError = (message) => {
    errors.push(message);
    appendFileSync(errorsLog, `${JSON.stringify({ message })}\n`);
  };

  /** name -> { versions: Map<version, entry>, tag, tagVersion }；离线镜像同名多版本必须全列，
   *  否则 npm 遇到 `seroval@~1.6.11` 这类范围只会看到最高版本 1.7.7 而报 ETARGET。 */
  const entries = new Map();
  const published = [];
  const errors = [];
  let packCount = 0;

  const register = (name, version, manifest, extra = {}) => {
    let group = entries.get(name);
    if (!group) {
      group = { versions: new Map(), tag: 'latest', tagVersion: '' };
      entries.set(name, group);
    }
    const existing = group.versions.get(version);
    if (existing) return existing;
    const entry = { name, version, manifest, ...extra, tarballFile: '', integrity: '', shasum: '' };
    group.versions.set(version, entry);
    return entry;
  };

  // 离线镜像：扫描 pnpm store 里所有已安装的真实包（含 scoped 包）。
  const pnpmDir = join(repoRoot, 'node_modules', '.pnpm');
  if (existsSync(pnpmDir)) {
    for (const storeName of readdirSync(pnpmDir)) {
      const nm = join(pnpmDir, storeName, 'node_modules');
      if (!existsSync(nm)) continue;
      for (const first of readdirSync(nm)) {
        const candidates = first.startsWith('@')
          ? readdirSync(join(nm, first)).map((second) => join(nm, first, second))
          : [join(nm, first)];
        for (const dir of candidates) {
          const pkgFile = join(dir, 'package.json');
          if (!existsSync(pkgFile)) continue;
          try {
            const manifest = JSON.parse(readFileSync(pkgFile, 'utf8'));
            if (!manifest.name || !manifest.version) continue;
            register(manifest.name, manifest.version, manifest, { pkgDir: dir, source: 'mirror' });
          } catch {
            /* 跳过损坏的 package.json */
          }
        }
      }
    }
  }

  const ensureTarball = (entry) => {
    if (entry.tarballFile && existsSync(join(tarballsDir, entry.tarballFile))) return true;
    if (!entry.pkgDir) return false;
    // 跨轮复用已生成的离线 tarball：镜像里的依赖版本不变，重复 npm pack 极慢。
    const guess = `${entry.name.startsWith('@') ? entry.name.slice(1).replace('/', '-') : entry.name}-${entry.version}.tgz`;
    const cached = join(tarballsDir, guess);
    if (existsSync(cached)) {
      const buf = readFileSync(cached);
      entry.tarballFile = guess;
      entry.integrity = `sha512-${createHash('sha512').update(buf).digest('base64')}`;
      entry.shasum = createHash('sha1').update(buf).digest('hex');
      return true;
    }
    const result = spawnSync(
      'npm',
      [
        'pack',
        entry.pkgDir,
        '--pack-destination',
        tarballsDir,
        '--json',
        '--ignore-scripts',
        '--silent',
      ],
      { encoding: 'utf8', env: envForNpm, maxBuffer: 16 * 1024 * 1024 },
    );
    packCount += 1;
    if (result.status !== 0) {
      pushError(`npm pack ${entry.name}@${entry.version} 失败: ${result.stderr?.slice(0, 300)}`);
      return false;
    }
    try {
      const info = JSON.parse(result.stdout)[0];
      entry.tarballFile = info.filename;
      entry.integrity = info.integrity ?? '';
      entry.shasum = info.shasum ?? '';
      appendFileSync(packsLog, `${JSON.stringify({ name: entry.name, version: entry.version })}\n`);
      return true;
    } catch {
      pushError(`npm pack ${entry.name}@${entry.version} 输出无法解析`);
      return false;
    }
  };

  const packument = (group, port) => {
    const versions = {};
    let firstName = '';
    for (const [version, entry] of group.versions) {
      if (!ensureTarball(entry)) continue;
      const m = entry.manifest ?? {};
      firstName = entry.name;
      versions[version] = {
        name: entry.name,
        version,
        description: m.description ?? '',
        license: m.license ?? '',
        author: m.author,
        dependencies: m.dependencies ?? {},
        optionalDependencies: m.optionalDependencies ?? {},
        peerDependencies: m.peerDependencies ?? {},
        peerDependenciesMeta: m.peerDependenciesMeta ?? {},
        engines: m.engines ?? {},
        bin: m.bin,
        dist: {
          tarball: `http://127.0.0.1:${port}/tarballs/${encodeURIComponent(entry.tarballFile)}`,
          integrity: entry.integrity,
          shasum: entry.shasum,
        },
      };
    }
    const available = Object.keys(versions);
    if (available.length === 0) return null;
    const latest = [...available].toSorted(compareVersion).at(-1);
    const tags = { latest };
    if (group.tag && group.tag !== 'latest') {
      tags[group.tag] = group.tagVersion || latest;
    }
    return { name: firstName, 'dist-tags': tags, versions };
  };

  const server = createServer((req, res) => {
    let body = Buffer.alloc(0);
    req.on('data', (chunk) => {
      body = Buffer.concat([body, chunk]);
    });
    req.on('end', () => {
      const host = req.headers.host ?? '';
      appendFileSync(
        requestLog,
        `${JSON.stringify({ method: req.method, url: req.url, host, bytes: body.length })}\n`,
      );
      const pathname = (req.url ?? '/').split('?')[0];

      try {
        if (req.method === 'GET' && pathname === '/-/ping') return json(res, 200, { ok: true });
        if (req.method === 'GET' && pathname === '/-/whoami') {
          return json(res, 200, { username: 'preview-local' });
        }
        if (req.method === 'POST' && pathname.includes('security/advisories')) {
          return json(res, 200, {});
        }
        if (req.method === 'GET' && pathname.startsWith('/tarballs/')) {
          const file = decodeURIComponent(pathname.slice('/tarballs/'.length));
          const abs = join(tarballsDir, file);
          if (!existsSync(abs)) return json(res, 404, { error: 'tarball not found' });
          res.writeHead(200, { 'content-type': 'application/octet-stream' });
          res.end(readFileSync(abs));
          return;
        }
        if (req.method === 'PUT') {
          const name = decodeName(pathname);
          const doc = JSON.parse(body.toString('utf8'));
          const attachments = doc['_attachments'] ?? {};
          const attachmentName = Object.keys(attachments)[0];
          if (!attachmentName) return json(res, 400, { error: 'missing _attachments' });
          const tarball = Buffer.from(attachments[attachmentName].data, 'base64');
          const version = Object.keys(doc.versions ?? {})[0] ?? '';
          const file = attachmentName.replace(/[^A-Za-z0-9._@+-]/g, '_');
          writeFileSync(join(tarballsDir, file), tarball);
          const tag = Object.keys(doc['dist-tags'] ?? {}).find((t) => t !== 'latest') ?? 'latest';
          const manifest = doc.versions?.[version] ?? {};
          const entry = register(name, version, manifest, { source: 'published', tag });
          const group = entries.get(name);
          group.tag = tag;
          group.tagVersion = version;
          entry.pkgDir = '';
          entry.tarballFile = file;
          entry.tag = tag;
          entry.integrity = `sha512-${createHash('sha512').update(tarball).digest('base64')}`;
          entry.shasum = createHash('sha1').update(tarball).digest('hex');
          const publishedEntry = {
            name,
            version,
            tag,
            tarball: file,
            bytes: tarball.length,
            dependencies: manifest.dependencies ?? {},
            author: manifest.author,
            license: manifest.license,
          };
          published.push(publishedEntry);
          appendFileSync(publishedLog, `${JSON.stringify(publishedEntry)}\n`);
          return json(res, 201, { ok: true, success: true });
        }
        if (req.method === 'GET') {
          const name = decodeName(pathname);
          const group = entries.get(name);
          if (!group) return json(res, 404, { error: 'not found' });
          const doc = packument(group, server.address().port);
          if (!doc) return json(res, 500, { error: 'offline tarball unavailable' });
          return json(res, 200, doc);
        }
        return json(res, 404, { error: 'unsupported' });
      } catch (error) {
        pushError(`${req.method} ${pathname}: ${String(error.message ?? error)}`);
        return json(res, 500, { error: String(error.message ?? error) });
      }
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/`;

  return {
    url,
    port,
    requestLog,
    publishedLog,
    errorsLog,
    packsLog,
    tarballsDir,
    published,
    errors,
    mirrorCount: entries.size,
    get packCount() {
      return packCount;
    },
    getEntry: (name) => {
      const group = entries.get(name);
      return group ? [...group.versions.values()].at(-1) : undefined;
    },
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

// 独立进程入口：主脚本用 spawnSync 跑 npm，若 registry 与其同进程会阻塞事件循环，
// 导致请求永远得不到响应。必须以子进程方式运行。
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [runDir, repoRoot, tarballsDir] = process.argv.slice(2);
  let envForNpm = {};
  try {
    envForNpm = JSON.parse(process.env.PREVIEW_REGISTRY_NPM_ENV ?? '{}');
  } catch {
    /* 允许父进程不传 */
  }
  const reg = await startRegistry({ runDir, repoRoot, envForNpm, tarballsDir });
  process.stdout.write(`REGISTRY_READY ${reg.url} ${reg.port} ${reg.mirrorCount}\n`);
  process.on('SIGTERM', () => {
    void reg.close().then(() => process.exit(0));
  });
  setInterval(() => {}, 1 << 30);
}
