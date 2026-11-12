import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import StyleDictionary from 'style-dictionary';
import { checkTokens } from './contrast.mjs';
import { buildPalette } from './palette.mjs';
import { CSS_PREFIX } from '../../../scripts/scope.mjs';

/**
 * T1-01 正式 Token 管线（01 §3 / 03 §2.3 / §3.1 / §12）：
 *   DTCG JSON + colorjs.io OKLCH 色阶 → Style Dictionary 解析别名 / outputReferences
 *   → CSS 变量 / TS 常量 / JSON，构建期按 WCAG 2.1 分档校验，不达标直接 exit 1。
 * 校验在清空 dist 之前执行，失败不会留下半成品产物。
 */
const pkgRoot = resolve(import.meta.dirname, '..');
const tokensRoot = join(pkgRoot, 'tokens');
const outDir = join(pkgRoot, 'dist');
const checkOnly = process.argv.includes('--check');

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const isToken = (node) =>
  node && typeof node === 'object' && !Array.isArray(node) && '$value' in node;

/** 递归收集路径 → token；DTCG 的自定义 $-字段随 token 一起保留。 */
const flatten = (value, prefix = [], out = new Map()) => {
  for (const [key, node] of Object.entries(value)) {
    const path = [...prefix, key];
    if (isToken(node)) out.set(path.join('.'), node);
    else if (node && typeof node === 'object' && !Array.isArray(node)) flatten(node, path, out);
  }
  return out;
};

/** token 对象深度合并：后者覆盖前者，同名分支递归。 */
const merge = (...objects) => {
  const result = {};
  for (const object of objects) {
    for (const [key, value] of Object.entries(object)) {
      if (isToken(value) || !(value && typeof value === 'object' && !Array.isArray(value))) {
        result[key] = value;
      } else {
        result[key] = merge(result[key] ?? {}, value);
      }
    }
  }
  return result;
};

const primitiveColor = readJson(join(tokensRoot, 'primitive', 'color.json'));
const primitiveScale = readJson(join(tokensRoot, 'primitive', 'scale.json'));
const primitiveType = readJson(join(tokensRoot, 'primitive', 'type.json'));
const component = readJson(join(tokensRoot, 'component', 'button.json'));
const semanticLight = readJson(join(tokensRoot, 'semantic', 'light.json'));
const semanticDark = readJson(join(tokensRoot, 'semantic', 'dark.json'));

const paletteLight = buildPalette('light');
const paletteDark = buildPalette('dark');
const semanticPaths = new Set(flatten(semanticLight).keys());
const palettePaths = new Set(flatten(paletteLight).keys());
const darkOverridePaths = new Set([...palettePaths, ...flatten(semanticDark).keys()]);

const tokenSets = {
  light: merge(
    paletteLight,
    primitiveColor,
    primitiveScale,
    primitiveType,
    component,
    semanticLight,
  ),
  dark: merge(paletteDark, primitiveColor, primitiveScale, primitiveType, component, semanticDark),
};

const cssOptions = (selector) => ({
  selector,
  outputReferences: true,
  showFileHeader: false,
});

const createDictionary = (theme, files) =>
  new StyleDictionary({
    usesDtcg: true,
    tokens: tokenSets[theme],
    platforms: {
      css: {
        prefix: CSS_PREFIX.replace(/-$/, ''),
        transforms: ['name/kebab'],
        buildPath: `${join(outDir, 'css')}/`,
        files,
      },
    },
  });

const sdLight = createDictionary('light', [
  {
    destination: 'tokens.css',
    format: 'css/variables',
    options: cssOptions(':root'),
  },
]);
const sdDark = createDictionary('dark', [
  {
    destination: 'theme-dark.css',
    format: 'css/variables',
    options: cssOptions("[data-theme='dark']"),
    filter: (token) => darkOverridePaths.has(token.path.join('.')),
  },
]);

/** SD 解析后的 token：值取 $value（引用已展开），分档元数据取 original（自定义字段全保留）。 */
const normalize = (token) => {
  const meta = token.original ?? {};
  return {
    path: token.path,
    $type: token.$type,
    $value: token.$value,
    $contrastTier: meta.$contrastTier ?? token.$contrastTier,
    $contrastBg: meta.$contrastBg ?? token.$contrastBg,
    $contrast: meta.$contrast ?? token.$contrast,
    $usage: meta.$usage ?? token.$usage,
  };
};

const dictionaries = {};
for (const [theme, sd] of Object.entries({ light: sdLight, dark: sdDark })) {
  const dictionary = await sd.getPlatformTokens('css');
  dictionaries[theme] = {
    sd,
    tokens: dictionary.allTokens.map(normalize),
    values: new Map(dictionary.allTokens.map((token) => [token.path.join('.'), token.$value])),
  };
}

// 03 §3.1：亮 / 暗各自跑同一套分档校验；漏标档位、缺参照背景、不达标一律失败。
const errors = ['light', 'dark'].flatMap((theme) =>
  checkTokens({ theme, tokens: dictionaries[theme].tokens, semanticPaths }),
);
if (errors.length > 0) {
  console.error('[tokens] contrast check FAILED:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

const checked = ['light', 'dark'].map(
  (theme) => dictionaries[theme].tokens.filter((token) => token.$contrastTier).length,
);
console.log(
  `[tokens] contrast check OK (light ${dictionaries.light.tokens.length} tokens / ${checked[0]} tiered, ` +
    `dark ${dictionaries.dark.tokens.length} tokens / ${checked[1]} tiered; ` +
    `${palettePaths.size} generated palette tokens)`,
);

if (checkOnly) process.exit(0);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, 'css'), { recursive: true });
mkdirSync(join(outDir, 'ts'), { recursive: true });
mkdirSync(join(outDir, 'json'), { recursive: true });

await sdLight.buildAllPlatforms();
await sdDark.buildAllPlatforms();

const pick = (theme, paths) =>
  Object.fromEntries([...paths].map((path) => [path, dictionaries[theme].values.get(path)]));

const lightTokens = pick('light', dictionaries.light.values.keys());
const darkTokens = pick('dark', darkOverridePaths);

writeFileSync(
  join(outDir, 'ts', 'tokens.ts'),
  `export const lightTokens = ${JSON.stringify(lightTokens, null, 2)} as const;\n\n` +
    `export const darkTokens = ${JSON.stringify(darkTokens, null, 2)} as const;\n\n` +
    `export type LightTokens = typeof lightTokens;\n` +
    `export type DarkTokens = typeof darkTokens;\n`,
);

const flatValues = (object, theme) => pick(theme, flatten(object).keys());
writeFileSync(
  join(outDir, 'json', 'tokens.json'),
  `${JSON.stringify(
    {
      primitive: flatValues(merge(primitiveColor, primitiveScale, primitiveType), 'light'),
      component: flatValues(component, 'light'),
      light: flatValues(semanticLight, 'light'),
      dark: flatValues(semanticDark, 'dark'),
      palette: { light: flatValues(paletteLight, 'light'), dark: flatValues(paletteDark, 'dark') },
    },
    null,
    2,
  )}\n`,
);

console.log(
  '[tokens] wrote dist/css/tokens.css, theme-dark.css, dist/ts/tokens.ts, dist/json/tokens.json',
);
