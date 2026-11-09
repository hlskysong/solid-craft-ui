import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import type { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * T1-14：llms.txt 的真实 HTTP 验收。
 * 所有链接都从 dev server 实际 GET，并断言 content-type 不是 HTML ——
 * Vite SPA fallback 会给不存在的路径返回 200 + index.html，只判状态码会「假 PASS」。
 */
type PageEntry = { path: string; title: string };
type ManifestShape = {
  pages: PageEntry[];
  exports: Record<string, string>;
  requiredSections: string[];
};

const readText = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8');
/** 生成物是外部 JSON，用运行时类型守卫收敛，不做类型断言。 */
const readGenerated = (rel: string): unknown => JSON.parse(readText(rel));
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const isPageEntry = (value: unknown): value is PageEntry =>
  isRecord(value) && typeof value.path === 'string' && typeof value.title === 'string';

const manifestRaw = readGenerated('apps/docs/public/llms/manifest.json');
if (!isRecord(manifestRaw) || !Array.isArray(manifestRaw.pages)) {
  throw new Error('llms/manifest.json 结构异常');
}
const pages: PageEntry[] = manifestRaw.pages.filter(isPageEntry);
const exportPages: Record<string, string> = isRecord(manifestRaw.exports)
  ? Object.fromEntries(
      Object.entries(manifestRaw.exports).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    )
  : {};
const requiredSections = stringList(manifestRaw.requiredSections);
const manifest: ManifestShape = { pages, exports: exportPages, requiredSections };

const coreRaw = readGenerated('packages/core/package.json');
const exportKeys =
  isRecord(coreRaw) && isRecord(coreRaw.exports) ? Object.keys(coreRaw.exports) : [];
const coreVersion = isRecord(coreRaw) && typeof coreRaw.version === 'string' ? coreRaw.version : '';

const extractLinks = (text: string): string[] =>
  [...text.matchAll(/\]\(([^)]+)\)/g)]
    .map((match) => match[1])
    .filter(
      (href): href is string =>
        typeof href === 'string' && !href.startsWith('#') && !href.startsWith('http'),
    );

const fetchText = async (request: APIRequestContext, href: string) => {
  const pathname = href.split('#')[0] ?? '';
  const response = await request.get(pathname);
  return { response, text: await response.text() };
};

/** 防 SPA fallback 假通过：不仅看 200，还要求返回的是非 HTML 的实质文本。 */
const assertTextResponse = (response: APIResponse, text: string, label: string) => {
  expect(response.status(), label).toBe(200);
  expect(response.headers()['content-type'] ?? '', label).not.toContain('text/html');
  expect(text.trim().length, label).toBeGreaterThan(40);
  expect(text.slice(0, 200).toLowerCase(), label).not.toContain('<!doctype html');
};

const asSitePath = (href: string, fromPath: string) =>
  new URL(href, `http://127.0.0.1:4173/${fromPath.replace(/^\//, '')}`).pathname;

test('llms.txt 结构合规，且 Docs / Optional 每条链接都能真实 GET', async ({ request }) => {
  const { response, text } = await fetchText(request, '/llms.txt');
  assertTextResponse(response, text, '/llms.txt');
  expect(text.startsWith('# solid-craft-ui\n')).toBe(true);
  expect(text).toMatch(/^> .+/m);
  expect(text).toContain('\n## Docs\n');
  expect(text).toContain('\n## Optional\n');
  // Q1-L1：站点索引带可机器解析的版本头，且与随包发布的副本逐字一致。
  expect(coreVersion.length).toBeGreaterThan(0);
  expect(text).toContain(`> Package: \`solid-craft@${coreVersion}\``);
  expect(readText('packages/core/llms.txt')).toBe(text);

  const lines = [...text.matchAll(/^- \[[^\]]+\]\([^)]+\): .+$/gm)];
  expect(lines.length).toBeGreaterThanOrEqual(30);
  const links = extractLinks(text);
  expect(links.length).toBe(lines.length);

  for (const href of links) {
    const { response: target, text: body } = await fetchText(request, href);
    assertTextResponse(target, body, href);
  }
});

test('逐页内部链接与 llms-full.txt 链接全部可解析', async ({ request }) => {
  const targets = new Set<string>();

  for (const page of manifest.pages) {
    const { response, text } = await fetchText(request, `/${page.path}`);
    assertTextResponse(response, text, page.path);
    expect(text.startsWith(page.title)).toBe(true);
    for (const href of extractLinks(text)) {
      targets.add(asSitePath(href, page.path));
    }
  }

  const full = await fetchText(request, '/llms-full.txt');
  assertTextResponse(full.response, full.text, '/llms-full.txt');
  for (const href of extractLinks(full.text)) {
    targets.add(asSitePath(href, '/llms-full.txt'));
  }

  expect(targets.size).toBeGreaterThan(20);
  for (const target of targets) {
    const { response, text } = await fetchText(request, target);
    assertTextResponse(response, text, target);
  }
});

test('每个 exports 子路径都有页面、被链接覆盖，且页面写明真实 specifier', async ({ request }) => {
  const { text } = await fetchText(request, '/llms.txt');
  const linked = new Set(extractLinks(text));
  expect(exportKeys.length).toBeGreaterThanOrEqual(12);
  expect(Object.keys(manifest.exports).length).toBe(exportKeys.length);

  for (const key of exportKeys) {
    const pagePath = manifest.exports[key];
    expect(pagePath, `manifest 缺少 exports 子路径 ${key}`).toBeTruthy();
    expect(linked.has(pagePath ?? ''), `${key} 未被 llms.txt 链接`).toBe(true);

    const { response, text: body } = await fetchText(request, `/${pagePath ?? ''}`);
    assertTextResponse(response, body, pagePath ?? key);
    const specifier = key === '.' ? 'solid-craft' : `solid-craft/${key.slice(2)}`;
    expect(body, `${key} 页面缺少 specifier`).toContain(specifier);
  }
});

test('llms-full.txt 含全部页面 / API 表 / Demo 源码 / Token / SSR / 三端消费', async ({
  request,
}) => {
  const { response, text } = await fetchText(request, '/llms-full.txt');
  assertTextResponse(response, text, '/llms-full.txt');
  expect(text.length).toBeGreaterThan(50_000);
  // Q1-L1：包内全量正文 / manifest 与站点产物逐字一致，版本必须与 package.json 相同。
  expect(readText('packages/core/llms-full.txt')).toBe(text);
  expect(readGenerated('packages/core/llms-manifest.json')).toEqual(manifestRaw);
  expect(isRecord(manifestRaw) ? manifestRaw.version : null).toBe(coreVersion);

  for (const page of manifest.pages) expect(text, `缺页面 ${page.path}`).toContain(page.title);
  for (const section of manifest.requiredSections) expect(text).toContain(section);
  expect(text).toContain('--scui-color-primary');
  expect(text).toContain('renderToString');
  expect(text).toContain('generateHydrationScript');

  for (const name of readdirSync('apps/docs/src/generated/api')) {
    const api = readGenerated(`apps/docs/src/generated/api/${name}`);
    if (!isRecord(api) || !Array.isArray(api.interfaces)) continue;
    const interfaces = api.interfaces.filter(
      (item): item is { name: string } => isRecord(item) && typeof item.name === 'string',
    );
    for (const iface of interfaces) expect(text, `缺 API 表 ${iface.name}`).toContain(iface.name);
  }

  for (const name of readdirSync('apps/docs/src/generated/demos')) {
    const demo = readGenerated(`apps/docs/src/generated/demos/${name}`);
    if (!isRecord(demo) || typeof demo.source !== 'string') continue;
    const label = typeof demo.path === 'string' ? demo.path : name;
    expect(text, `缺 Demo 源码 ${label}`).toContain(demo.source.trimEnd());
  }
});
