/**
 * 下载并解包上游设计资源（仅本地缓存，不进 git；不进 verify 链）。
 * 用法：node reference/design-baseline/fetch-upstream.mjs
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';

const root = dirname(new URL(import.meta.url).pathname);
const cache = join(root, '.cache');
mkdirSync(cache, { recursive: true });

const packages = [
  ['antd', '6.7.0', 'https://registry.npmjs.org/antd/-/antd-6.7.0.tgz'],
  [
    'ant-design-colors',
    '8.0.1',
    'https://registry.npmjs.org/@ant-design/colors/-/colors-8.0.1.tgz',
  ],
  [
    'semi-foundation',
    '2.104.0',
    'https://registry.npmjs.org/@douyinfe/semi-foundation/-/semi-foundation-2.104.0.tgz',
  ],
  [
    'semi-theme-default',
    '2.104.0',
    'https://registry.npmjs.org/@douyinfe/semi-theme-default/-/semi-theme-default-2.104.0.tgz',
  ],
  [
    'tdesign-vue-next',
    '1.20.11',
    'https://registry.npmjs.org/tdesign-vue-next/-/tdesign-vue-next-1.20.11.tgz',
  ],
];

for (const [name, version, url] of packages) {
  const tarball = join(cache, `${name}-${version}.tgz`);
  const dir = join(cache, name);
  if (!existsSync(tarball)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${name} HTTP ${res.status}`);
    writeFileSync(tarball, Buffer.from(await res.arrayBuffer()));
    console.log(`downloaded ${name}@${version}`);
  }
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    execFileSync('tar', ['-xzf', tarball, '-C', dir, '--strip-components=1']);
    console.log(`extracted ${name}`);
  }
}

// TDesign 的 token 真源在 tdesign-common 仓库（npm 上是空壳 0.0.1-alpha.0）
const tdesignRaw = [
  [
    'tdesign-common-variables.less',
    'https://raw.githubusercontent.com/Tencent/tdesign-common/main/style/web/_variables.less',
  ],
  [
    'tdesign-common-index.less',
    'https://raw.githubusercontent.com/Tencent/tdesign-common/main/style/web/index.less',
  ],
];
for (const [file, url] of tdesignRaw) {
  const target = join(cache, file);
  if (existsSync(target)) continue;
  const res = await fetch(url);
  if (!res.ok) {
    console.log(`WARN ${file} HTTP ${res.status}`);
    continue;
  }
  writeFileSync(target, await res.text());
  console.log(`saved ${file}`);
}
